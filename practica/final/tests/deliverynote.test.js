import { describe, it, expect, beforeAll, jest } from '@jest/globals';
import request from 'supertest';
import mongoose from 'mongoose';
import './setup.js';

// ESM-compatible mocks — deben ir ANTES de los dynamic imports
jest.unstable_mockModule('../src/services/storage.service.js', () => ({
    uploadImage: jest.fn().mockResolvedValue({ url: 'http://mock/sig.webp', publicId: 'mock_sig' }),
    uploadPdf: jest.fn().mockResolvedValue({ url: 'http://mock/note.pdf', publicId: 'mock_pdf' })
}));

jest.unstable_mockModule('../src/services/pdf.service.js', () => ({
    generateDeliveryNotePdf: jest.fn().mockResolvedValue(Buffer.from('fake-pdf-content'))
}));

jest.unstable_mockModule('sharp', () => ({
    default: jest.fn().mockReturnValue({
        resize: jest.fn().mockReturnThis(),
        webp: jest.fn().mockReturnThis(),
        toBuffer: jest.fn().mockResolvedValue(Buffer.from('fake-image'))
    })
}));

// Dynamic imports DESPUÉS del mock
const { default: app } = await import('../src/app.js');
const { default: User } = await import('../src/models/user.model.js');
const { default: Company } = await import('../src/models/company.model.js');
const { default: Client } = await import('../src/models/client.model.js');
const { default: Project } = await import('../src/models/project.model.js');
const { default: DeliveryNote } = await import('../src/models/deliverynote.model.js');

const agent = request(app);
let token;
let clientId;
let projectId;
let noteId;

beforeAll(async () => {
    const company = await Company.create({ owner: new mongoose.Types.ObjectId(), name: 'DNco', cif: 'A33333333' });
    const user = await User.create({
        email: 'dnuser@test.com', password: 'hashedpassword123',
        company: company._id, status: 'verified', role: 'admin'
    });
    const client = await Client.create({ user: user._id, company: company._id, name: 'Cliente DN', cif: 'C11111111' });
    clientId = client._id.toString();
    const project = await Project.create({ user: user._id, company: company._id, client: client._id, name: 'Proyecto DN', projectCode: 'DN001' });
    projectId = project._id.toString();

    const { tokenSign } = await import('../src/utils/handleJwt.js');
    token = tokenSign(user);
});

const baseNote = () => ({
    format: 'hours',
    client: clientId,
    project: projectId,
    workDate: new Date().toISOString(),
    hours: 8,
    description: 'Trabajo test'
});

describe('POST /api/deliverynote', () => {
    it('crea albarán de horas', async () => {
        const res = await agent.post('/api/deliverynote').set('Authorization', `Bearer ${token}`).send(baseNote());
        expect(res.status).toBe(201);
        expect(res.body.format).toBe('hours');
        expect(res.body.signed).toBe(false);
        noteId = res.body._id;
    });

    it('crea albarán de materiales', async () => {
        const res = await agent.post('/api/deliverynote').set('Authorization', `Bearer ${token}`).send({
            format: 'material', client: clientId, project: projectId,
            workDate: new Date().toISOString(),
            material: 'Cemento', quantity: 10, unit: 'sacos'
        });
        expect(res.status).toBe(201);
        expect(res.body.format).toBe('material');
    });

    it('rechaza albarán de horas sin hours ni workers', async () => {
        const res = await agent.post('/api/deliverynote').set('Authorization', `Bearer ${token}`).send({
            format: 'hours', client: clientId, project: projectId,
            workDate: new Date().toISOString()
        });
        expect(res.status).toBe(400);
    });

    it('crea albarán con workers[]', async () => {
        const res = await agent.post('/api/deliverynote').set('Authorization', `Bearer ${token}`).send({
            format: 'hours', client: clientId, project: projectId,
            workDate: new Date().toISOString(),
            workers: [{ name: 'Juan', hours: 4 }, { name: 'Ana', hours: 4 }]
        });
        expect(res.status).toBe(201);
        expect(res.body.workers).toHaveLength(2);
    });
});

describe('GET /api/deliverynote', () => {
    it('lista albaranes con paginación', async () => {
        const res = await agent.get('/api/deliverynote?page=1&limit=10').set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('data');
        expect(res.body).toHaveProperty('totalPages');
        expect(res.body).toHaveProperty('totalItems');
    });

    it('filtra por format', async () => {
        const res = await agent.get('/api/deliverynote?format=hours').set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(200);
        expect(res.body.data.every(n => n.format === 'hours')).toBe(true);
    });

    it('filtra por signed=false', async () => {
        const res = await agent.get('/api/deliverynote?signed=false').set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(200);
        expect(res.body.data.every(n => !n.signed)).toBe(true);
    });

    it('obtiene albarán por id con populate', async () => {
        const res = await agent.get(`/api/deliverynote/${noteId}`).set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('client');
        expect(res.body).toHaveProperty('project');
        expect(res.body).toHaveProperty('user');
    });
});

describe('PATCH /:id/sign', () => {
    const pngBuffer = Buffer.from([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
        0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
        0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
        0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
        0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41,
        0x54, 0x08, 0xD7, 0x63, 0xF8, 0xCF, 0xC0, 0x00,
        0x00, 0x00, 0x02, 0x00, 0x01, 0xE2, 0x21, 0xBC,
        0x33, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E,
        0x44, 0xAE, 0x42, 0x60, 0x82
    ]);

    it('firma albarán con imagen', async () => {
        const res = await agent
            .patch(`/api/deliverynote/${noteId}/sign`)
            .set('Authorization', `Bearer ${token}`)
            .attach('signature', pngBuffer, { filename: 'firma.png', contentType: 'image/png' });
        expect(res.status).toBe(200);
        expect(res.body.signed).toBe(true);
        expect(res.body.signatureUrl).toBe('http://mock/sig.webp');
        expect(res.body.pdfUrl).toBe('http://mock/note.pdf');
    });

    it('rechaza segunda firma', async () => {
        const res = await agent
            .patch(`/api/deliverynote/${noteId}/sign`)
            .set('Authorization', `Bearer ${token}`)
            .attach('signature', pngBuffer, { filename: 'firma.png', contentType: 'image/png' });
        expect(res.status).toBe(409);
    });
});

describe('DELETE /api/deliverynote/:id', () => {
    it('rechaza borrar albarán firmado', async () => {
        const res = await agent.delete(`/api/deliverynote/${noteId}`).set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(409);
    });

    it('borra albarán no firmado', async () => {
        const create = await agent.post('/api/deliverynote').set('Authorization', `Bearer ${token}`).send(baseNote());
        const id = create.body._id;
        const res = await agent.delete(`/api/deliverynote/${id}`).set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(200);
    });
});
