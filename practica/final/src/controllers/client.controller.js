import Client from '../models/client.model.js';
import AppError from '../utils/AppError.js';
import { getIo } from '../config/socket.js';

const parseSortQuery = (sortStr, allowed) => {
    if (!sortStr) return { createdAt: -1 };
    const desc = sortStr.startsWith('-');
    const field = desc ? sortStr.slice(1) : sortStr;
    if (!allowed.includes(field)) return { createdAt: -1 };
    return { [field]: desc ? -1 : 1 };
};

// POST /api/client
export const createClient = async (req, res, next) => {
    try {
        const { name, cif, email, phone, address } = req.body;
        const companyId = req.user.company;

        if (!companyId) return next(AppError.badRequest('Usuario sin compañía asociada'));

        const exists = await Client.findOne({ company: companyId, cif: cif.toUpperCase(), deleted: false });
        if (exists) return next(AppError.conflict('Ya existe un cliente con ese CIF en tu compañía'));

        const client = await Client.create({
            user: req.user._id,
            company: companyId,
            name, cif, email, phone, address
        });

        const io = getIo();
        if (io) io.to(companyId.toString()).emit('client:new', client);

        res.status(201).json(client);
    } catch (err) {
        next(err);
    }
};

// PUT /api/client/:id
export const updateClient = async (req, res, next) => {
    try {
        const client = await Client.findOne({ _id: req.params.id, company: req.user.company, deleted: false });
        if (!client) return next(AppError.notFound('Cliente'));

        const { name, cif, email, phone, address } = req.body;

        if (cif && cif.toUpperCase() !== client.cif) {
            const exists = await Client.findOne({ company: req.user.company, cif: cif.toUpperCase(), deleted: false, _id: { $ne: client._id } });
            if (exists) return next(AppError.conflict('Ya existe un cliente con ese CIF en tu compañía'));
        }

        Object.assign(client, { name, cif, email, phone, address });
        await client.save();

        res.status(200).json(client);
    } catch (err) {
        next(err);
    }
};

// GET /api/client
export const listClients = async (req, res, next) => {
    try {
        const { name, sort, page = 1, limit = 10 } = req.query;

        const filter = { company: req.user.company, deleted: false };
        if (name) filter.name = { $regex: name, $options: 'i' };

        const sortObj = parseSortQuery(sort, ['name', 'createdAt', 'cif']);
        const skip = (Number(page) - 1) * Number(limit);

        const [clients, total] = await Promise.all([
            Client.find(filter).sort(sortObj).skip(skip).limit(Number(limit)),
            Client.countDocuments(filter)
        ]);

        res.status(200).json({
            data: clients,
            totalItems: total,
            totalPages: Math.ceil(total / Number(limit)),
            currentPage: Number(page)
        });
    } catch (err) {
        next(err);
    }
};

// GET /api/client/:id
export const getClient = async (req, res, next) => {
    try {
        const client = await Client.findOne({ _id: req.params.id, company: req.user.company, deleted: false });
        if (!client) return next(AppError.notFound('Cliente'));
        res.status(200).json(client);
    } catch (err) {
        next(err);
    }
};

// DELETE /api/client/:id
export const deleteClient = async (req, res, next) => {
    try {
        const client = await Client.findOne({ _id: req.params.id, company: req.user.company, deleted: false });
        if (!client) return next(AppError.notFound('Cliente'));

        if (req.query.soft === 'true') {
            client.deleted = true;
            await client.save();
        } else {
            await client.deleteOne();
        }

        res.status(200).json({ message: 'Cliente eliminado' });
    } catch (err) {
        next(err);
    }
};

// GET /api/client/archived
export const listArchivedClients = async (req, res, next) => {
    try {
        const clients = await Client.find({ company: req.user.company, deleted: true });
        res.status(200).json(clients);
    } catch (err) {
        next(err);
    }
};

// PATCH /api/client/:id/restore
export const restoreClient = async (req, res, next) => {
    try {
        const client = await Client.findOne({ _id: req.params.id, company: req.user.company, deleted: true });
        if (!client) return next(AppError.notFound('Cliente archivado'));

        client.deleted = false;
        await client.save();

        res.status(200).json(client);
    } catch (err) {
        next(err);
    }
};
