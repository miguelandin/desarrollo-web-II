import { describe, it, expect, jest } from '@jest/globals';
import './setup.js';

// -- pdf.service tests --
describe('pdf.service — generateDeliveryNotePdf', () => {
    let generateDeliveryNotePdf;

    beforeAll(async () => {
        ({ generateDeliveryNotePdf } = await import('../src/services/pdf.service.js'));
    });

    const mockNote = {
        format: 'hours',
        workDate: new Date('2025-01-15'),
        description: 'Trabajo de prueba',
        hours: 8,
        signed: false,
        user: { name: 'Juan', lastName: 'García', email: 'juan@test.com' },
        company: { name: 'TestCo', cif: 'A12345678', address: { street: 'Calle Mayor', number: '1', city: 'Madrid' } },
        client: { name: 'Cliente SL', cif: 'B12345678', email: 'cliente@test.com', address: { street: 'Av. Test', number: '2', city: 'Barcelona' } },
        project: { name: 'Proyecto Alpha', projectCode: 'PRJ001', address: { street: 'Calle Obra', number: '3', city: 'Valencia' } }
    };

    it('genera PDF de albarán de horas (sin firma)', async () => {
        const buffer = await generateDeliveryNotePdf(mockNote);
        expect(Buffer.isBuffer(buffer)).toBe(true);
        expect(buffer.length).toBeGreaterThan(100);
    });

    it('genera PDF de albarán de materiales', async () => {
        const note = { ...mockNote, format: 'material', material: 'Cemento', quantity: 10, unit: 'sacos', hours: undefined };
        const buffer = await generateDeliveryNotePdf(note);
        expect(Buffer.isBuffer(buffer)).toBe(true);
    });

    it('genera PDF con workers[]', async () => {
        const note = { ...mockNote, workers: [{ name: 'Ana', hours: 4 }, { name: 'Luis', hours: 4 }], hours: undefined };
        const buffer = await generateDeliveryNotePdf(note);
        expect(Buffer.isBuffer(buffer)).toBe(true);
    });

    it('genera PDF firmado con texto de firma', async () => {
        const note = { ...mockNote, signed: true, signedAt: new Date(), signatureUrl: 'http://mock/sig.webp' };
        const buffer = await generateDeliveryNotePdf(note);
        expect(Buffer.isBuffer(buffer)).toBe(true);
    });

    it('genera PDF firmado con imagen de firma (buffer)', async () => {
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
        const note = { ...mockNote, signed: true, signedAt: new Date(), signatureUrl: 'http://mock/sig.webp' };
        const buffer = await generateDeliveryNotePdf(note, pngBuffer);
        expect(Buffer.isBuffer(buffer)).toBe(true);
    });

    it('genera PDF sin datos de company ni client (null safe)', async () => {
        const note = { ...mockNote, company: null, client: null, project: null, user: null };
        const buffer = await generateDeliveryNotePdf(note);
        expect(Buffer.isBuffer(buffer)).toBe(true);
    });
});

// -- logger.service tests --
describe('logger.service — notifySlackError', () => {
    let notifySlackError;

    beforeAll(async () => {
        ({ notifySlackError } = await import('../src/services/logger.service.js'));
    });

    it('no lanza si SLACK_WEBHOOK_URL no está configurado', async () => {
        delete process.env.SLACK_WEBHOOK_URL;
        const req = { method: 'GET', originalUrl: '/api/test' };
        const err = { message: 'Test error', statusCode: 500, stack: 'Error stack' };
        await expect(notifySlackError(req, err)).resolves.toBeUndefined();
    });

    it('llama a fetch con webhook URL configurada', async () => {
        process.env.SLACK_WEBHOOK_URL = 'https://hooks.slack.com/test';
        const mockFetch = jest.fn().mockResolvedValue({ ok: true });
        global.fetch = mockFetch;

        const req = { method: 'POST', originalUrl: '/api/deliverynote' };
        const err = { message: 'Internal error', statusCode: 500, stack: 'Error\n  at ...' };
        await notifySlackError(req, err);

        expect(mockFetch).toHaveBeenCalledWith(
            'https://hooks.slack.com/test',
            expect.objectContaining({ method: 'POST' })
        );
    });

    it('no lanza si fetch falla', async () => {
        process.env.SLACK_WEBHOOK_URL = 'https://hooks.slack.com/test';
        global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

        const req = { method: 'GET', originalUrl: '/api/test' };
        const err = { message: 'Error', statusCode: 500 };
        await expect(notifySlackError(req, err)).resolves.toBeUndefined();
    });
});
