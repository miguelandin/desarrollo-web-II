import DeliveryNote from '../models/deliverynote.model.js';
import Project from '../models/project.model.js';
import Client from '../models/client.model.js';
import AppError from '../utils/AppError.js';
import { getIo } from '../config/socket.js';
import { uploadImage, uploadPdf } from '../services/storage.service.js';
import { generateDeliveryNotePdf } from '../services/pdf.service.js';
import sharp from 'sharp';

const parseSortQuery = (sortStr, allowed) => {
    if (!sortStr) return { workDate: -1 };
    const desc = sortStr.startsWith('-');
    const field = desc ? sortStr.slice(1) : sortStr;
    if (!allowed.includes(field)) return { workDate: -1 };
    return { [field]: desc ? -1 : 1 };
};

// POST /api/deliverynote
export const createDeliveryNote = async (req, res, next) => {
    try {
        const companyId = req.user.company;
        if (!companyId) return next(AppError.badRequest('Usuario sin compañía asociada'));

        const { format, client, project, description, workDate, material, quantity, unit, hours, workers } = req.body;

        const [clientDoc, projectDoc] = await Promise.all([
            Client.findOne({ _id: client, company: companyId, deleted: false }),
            Project.findOne({ _id: project, company: companyId, deleted: false })
        ]);

        if (!clientDoc) return next(AppError.notFound('Cliente'));
        if (!projectDoc) return next(AppError.notFound('Proyecto'));

        const note = await DeliveryNote.create({
            user: req.user._id,
            company: companyId,
            client, project, format, description, workDate,
            material, quantity, unit,
            hours, workers
        });

        const io = getIo();
        if (io) io.to(companyId.toString()).emit('deliverynote:new', note);

        res.status(201).json(note);
    } catch (err) {
        next(err);
    }
};

// GET /api/deliverynote
export const listDeliveryNotes = async (req, res, next) => {
    try {
        const { project, client, format, signed, from, to, sort, page = 1, limit = 10 } = req.query;

        const filter = { company: req.user.company, deleted: false };
        if (project) filter.project = project;
        if (client) filter.client = client;
        if (format) filter.format = format;
        if (signed !== undefined) filter.signed = signed === 'true';
        if (from || to) {
            filter.workDate = {};
            if (from) filter.workDate.$gte = new Date(from);
            if (to) filter.workDate.$lte = new Date(to);
        }

        const sortObj = parseSortQuery(sort, ['workDate', 'createdAt']);
        const skip = (Number(page) - 1) * Number(limit);

        const [notes, total] = await Promise.all([
            DeliveryNote.find(filter)
                .populate('client', 'name cif')
                .populate('project', 'name projectCode')
                .sort(sortObj).skip(skip).limit(Number(limit)),
            DeliveryNote.countDocuments(filter)
        ]);

        res.status(200).json({
            data: notes,
            totalItems: total,
            totalPages: Math.ceil(total / Number(limit)),
            currentPage: Number(page)
        });
    } catch (err) {
        next(err);
    }
};

// GET /api/deliverynote/:id
export const getDeliveryNote = async (req, res, next) => {
    try {
        const note = await DeliveryNote.findOne({ _id: req.params.id, company: req.user.company, deleted: false })
            .populate('user', 'name lastName email')
            .populate('client')
            .populate('project');

        if (!note) return next(AppError.notFound('Albarán'));
        res.status(200).json(note);
    } catch (err) {
        next(err);
    }
};

// GET /api/deliverynote/pdf/:id
export const downloadPdf = async (req, res, next) => {
    try {
        const note = await DeliveryNote.findOne({ _id: req.params.id, company: req.user.company, deleted: false })
            .populate('user', 'name lastName email')
            .populate('company')
            .populate('client')
            .populate('project');

        if (!note) return next(AppError.notFound('Albarán'));

        if (note.signed && note.pdfUrl) {
            return res.redirect(note.pdfUrl);
        }

        const buffer = await generateDeliveryNotePdf(note);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="albaran-${note._id}.pdf"`);
        res.send(buffer);
    } catch (err) {
        next(err);
    }
};

// PATCH /api/deliverynote/:id/sign
export const signDeliveryNote = async (req, res, next) => {
    try {
        if (!req.file) return next(AppError.badRequest('Imagen de firma requerida'));

        const note = await DeliveryNote.findOne({ _id: req.params.id, company: req.user.company, deleted: false });
        if (!note) return next(AppError.notFound('Albarán'));
        if (note.signed) return next(AppError.conflict('El albarán ya está firmado'));

        // Optimizar imagen con Sharp
        const signatureBuffer = await sharp(req.file.buffer)
            .resize({ width: 800, withoutEnlargement: true })
            .webp({ quality: 80 })
            .toBuffer();

        // Subir firma a Cloudinary
        const { url: signatureUrl } = await uploadImage(signatureBuffer, 'signatures');

        // Poblar datos para generar PDF
        const populated = await DeliveryNote.findById(note._id)
            .populate('user', 'name lastName email')
            .populate('company')
            .populate('client')
            .populate('project');

        populated.signed = true;
        populated.signedAt = new Date();
        populated.signatureUrl = signatureUrl;

        // Generar PDF con imagen de firma
        const pdfBuffer = await generateDeliveryNotePdf(populated, signatureBuffer);
        const { url: pdfUrl } = await uploadPdf(pdfBuffer, 'deliverynotes');

        // Guardar en BD
        note.signed = true;
        note.signedAt = populated.signedAt;
        note.signatureUrl = signatureUrl;
        note.pdfUrl = pdfUrl;
        await note.save();

        const io = getIo();
        if (io) io.to(req.user.company.toString()).emit('deliverynote:signed', note);

        res.status(200).json(note);
    } catch (err) {
        next(err);
    }
};

// DELETE /api/deliverynote/:id
export const deleteDeliveryNote = async (req, res, next) => {
    try {
        const note = await DeliveryNote.findOne({ _id: req.params.id, company: req.user.company, deleted: false });
        if (!note) return next(AppError.notFound('Albarán'));
        if (note.signed) return next(AppError.conflict('No se puede eliminar un albarán firmado'));

        await note.deleteOne();
        res.status(200).json({ message: 'Albarán eliminado' });
    } catch (err) {
        next(err);
    }
};
