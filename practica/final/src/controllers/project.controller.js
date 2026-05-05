import Project from '../models/project.model.js';
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

// POST /api/project
export const createProject = async (req, res, next) => {
    try {
        const { name, projectCode, client, address, email, notes, active } = req.body;
        const companyId = req.user.company;

        if (!companyId) return next(AppError.badRequest('Usuario sin compañía asociada'));

        const clientDoc = await Client.findOne({ _id: client, company: companyId, deleted: false });
        if (!clientDoc) return next(AppError.notFound('Cliente'));

        const exists = await Project.findOne({ company: companyId, projectCode: projectCode.toUpperCase(), deleted: false });
        if (exists) return next(AppError.conflict('Ya existe un proyecto con ese código en tu compañía'));

        const project = await Project.create({
            user: req.user._id,
            company: companyId,
            client, name, projectCode, address, email, notes,
            active: active ?? true
        });

        const io = getIo();
        if (io) io.to(companyId.toString()).emit('project:new', project);

        res.status(201).json(project);
    } catch (err) {
        next(err);
    }
};

// PUT /api/project/:id
export const updateProject = async (req, res, next) => {
    try {
        const project = await Project.findOne({ _id: req.params.id, company: req.user.company, deleted: false });
        if (!project) return next(AppError.notFound('Proyecto'));

        const { name, projectCode, client, address, email, notes, active } = req.body;

        if (projectCode && projectCode.toUpperCase() !== project.projectCode) {
            const exists = await Project.findOne({ company: req.user.company, projectCode: projectCode.toUpperCase(), deleted: false, _id: { $ne: project._id } });
            if (exists) return next(AppError.conflict('Ya existe un proyecto con ese código en tu compañía'));
        }

        if (client) {
            const clientDoc = await Client.findOne({ _id: client, company: req.user.company, deleted: false });
            if (!clientDoc) return next(AppError.notFound('Cliente'));
        }

        Object.assign(project, { name, projectCode, client, address, email, notes, active });
        await project.save();

        res.status(200).json(project);
    } catch (err) {
        next(err);
    }
};

// GET /api/project
export const listProjects = async (req, res, next) => {
    try {
        const { client, name, active, sort, page = 1, limit = 10 } = req.query;

        const filter = { company: req.user.company, deleted: false };
        if (client) filter.client = client;
        if (name) filter.name = { $regex: name, $options: 'i' };
        if (active !== undefined) filter.active = active === 'true';

        const sortObj = parseSortQuery(sort, ['name', 'createdAt', 'projectCode']);
        const skip = (Number(page) - 1) * Number(limit);

        const [projects, total] = await Promise.all([
            Project.find(filter).populate('client', 'name cif').sort(sortObj).skip(skip).limit(Number(limit)),
            Project.countDocuments(filter)
        ]);

        res.status(200).json({
            data: projects,
            totalItems: total,
            totalPages: Math.ceil(total / Number(limit)),
            currentPage: Number(page)
        });
    } catch (err) {
        next(err);
    }
};

// GET /api/project/:id
export const getProject = async (req, res, next) => {
    try {
        const project = await Project.findOne({ _id: req.params.id, company: req.user.company, deleted: false })
            .populate('client', 'name cif email');
        if (!project) return next(AppError.notFound('Proyecto'));
        res.status(200).json(project);
    } catch (err) {
        next(err);
    }
};

// DELETE /api/project/:id
export const deleteProject = async (req, res, next) => {
    try {
        const project = await Project.findOne({ _id: req.params.id, company: req.user.company, deleted: false });
        if (!project) return next(AppError.notFound('Proyecto'));

        if (req.query.soft === 'true') {
            project.deleted = true;
            await project.save();
        } else {
            await project.deleteOne();
        }

        res.status(200).json({ message: 'Proyecto eliminado' });
    } catch (err) {
        next(err);
    }
};

// GET /api/project/archived
export const listArchivedProjects = async (req, res, next) => {
    try {
        const projects = await Project.find({ company: req.user.company, deleted: true })
            .populate('client', 'name cif');
        res.status(200).json(projects);
    } catch (err) {
        next(err);
    }
};

// PATCH /api/project/:id/restore
export const restoreProject = async (req, res, next) => {
    try {
        const project = await Project.findOne({ _id: req.params.id, company: req.user.company, deleted: true });
        if (!project) return next(AppError.notFound('Proyecto archivado'));

        project.deleted = false;
        await project.save();

        res.status(200).json(project);
    } catch (err) {
        next(err);
    }
};
