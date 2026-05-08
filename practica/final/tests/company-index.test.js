import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import mongoose from 'mongoose';
import Company from '../src/models/company.model.js';
import './setup.js';

const fakeOwner = () => new mongoose.Types.ObjectId();
const CIF_A = 'X11111111';
const CIF_B = 'X22222222';

beforeAll(async () => {
    // Fuerza creación de índices en la BD de test
    await Company.syncIndexes();
    await Company.deleteMany({ cif: { $in: [CIF_A, CIF_B] } });
});

describe('Company partialFilterExpression — dos activas mismo CIF', () => {
    it('crea primera empresa activa', async () => {
        const company = await Company.create({ owner: fakeOwner(), name: 'Empresa A', cif: CIF_A });
        expect(company._id).toBeDefined();
    });

    it('rechaza segunda empresa activa con mismo CIF', async () => {
        await expect(
            Company.create({ owner: fakeOwner(), name: 'Empresa B', cif: CIF_A })
        ).rejects.toThrow(/duplicate key|E11000/i);
    });

    it('permite empresa eliminada con mismo CIF que una activa', async () => {
        const deleted = await Company.create({ owner: fakeOwner(), name: 'Empresa C', cif: CIF_A, deleted: true });
        expect(deleted.deleted).toBe(true);
    });

    it('permite múltiples empresas eliminadas con mismo CIF', async () => {
        const deleted2 = await Company.create({ owner: fakeOwner(), name: 'Empresa D', cif: CIF_A, deleted: true });
        expect(deleted2._id).toBeDefined();
    });
});

describe('Company partialFilterExpression — restaurar empresa eliminada', () => {
    let deletedId;

    beforeAll(async () => {
        const company = await Company.create({ owner: fakeOwner(), name: 'Original', cif: CIF_B });
        await Company.findByIdAndUpdate(company._id, { deleted: true });
        deletedId = company._id;
    });

    it('restaura empresa eliminada cuando no hay activa con mismo CIF', async () => {
        const restored = await Company.findByIdAndUpdate(deletedId, { deleted: false }, { new: true });
        expect(restored.deleted).toBe(false);
    });

    it('no puede restaurar empresa eliminada si ya existe activa con mismo CIF', async () => {
        // Hay una activa (la recién restaurada). Crear otra eliminada con mismo CIF.
        const toRestore = await Company.create({ owner: fakeOwner(), name: 'Duplicada', cif: CIF_B, deleted: true });

        // Intentar activarla → viola el índice único parcial
        await expect(
            Company.findByIdAndUpdate(toRestore._id, { deleted: false }, { new: true })
        ).rejects.toThrow(/duplicate key|E11000/i);
    });
});
