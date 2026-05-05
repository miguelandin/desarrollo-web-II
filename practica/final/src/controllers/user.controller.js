import User from '../models/user.model.js';
import Company from '../models/company.model.js';
import { encrypt, compare } from '../utils/handlePassword.js';
import { tokenSign, refreshTokenSign } from '../utils/handleJwt.js';
import AppError from '../utils/AppError.js';
import jwt from 'jsonwebtoken';
import bcryptjs from 'bcryptjs';
import crypto from 'crypto';
import notificationService from '../services/notification.service.js';
import { sendVerificationEmail } from '../services/mail.service.js';

// POST /api/user/register
export const register = async (req, res, next) => {
    try {
        const { email, password, name, lastName, nif, address } = req.body;

        const existingUser = await User.findOne({ email, status: 'verified' });
        if (existingUser) return next(AppError.conflict('Email ya registrado'));

        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        const hash = await encrypt(password);

        const user = await User.create({ email, password: hash, name, lastName, nif, verificationCode, address });

        const accessToken = tokenSign(user);
        const refreshToken = refreshTokenSign(user);

        notificationService.emit('user:registered', user);

        try {
            await sendVerificationEmail(user.email, verificationCode);
        } catch {
            // No bloquear el registro si el email falla
        }

        res.status(201).json({
            accessToken,
            refreshToken,
            user: { email: user.email, status: user.status, role: user.role }
        });
    } catch (err) {
        next(err);
    }
};

// PUT /api/user/validation
export const validateEmail = async (req, res, next) => {
    try {
        const { code } = req.body;
        const user = await User.findById(req.user._id).select('+verificationCode +verificationAttempts');

        if (!user) return next(AppError.notFound('Usuario'));
        if (user.status === 'verified') return next(AppError.badRequest('Email ya verificado'));
        if (user.verificationAttempts <= 0) return next(AppError.tooManyRequests('Demasiados intentos'));

        if (user.verificationCode === code) {
            user.status = 'verified';
            user.verificationCode = undefined;
            await user.save();
            notificationService.emit('user:verified', user);
            return res.status(200).json({ message: 'Email verificado' });
        } else {
            user.verificationAttempts -= 1;
            await user.save();
            return next(AppError.badRequest('Código incorrecto'));
        }
    } catch (err) {
        next(err);
    }
};

// POST /api/user/login
export const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email, deleted: false }).select('+password');

        if (!user) return next(AppError.notFound('Usuario'));

        if (!(await compare(password, user.password))) {
            return next(AppError.unauthorized('Credenciales inválidas'));
        }

        const accessToken = tokenSign(user);
        const refreshToken = refreshTokenSign(user);

        res.status(200).json({
            accessToken,
            refreshToken,
            user: { email: user.email, status: user.status, role: user.role }
        });
    } catch (err) {
        next(err);
    }
};

// PUT /api/user/register (Onboarding personal)
export const updatePersonalData = async (req, res, next) => {
    try {
        const allowedFields = ['name', 'lastName', 'nif', 'address'];
        const updateData = {};
        allowedFields.forEach(field => {
            if (req.body[field] !== undefined) updateData[field] = req.body[field];
        });

        const user = await User.findByIdAndUpdate(req.user._id, updateData, { new: true });
        res.status(200).json(user);
    } catch (err) {
        next(err);
    }
};

// PATCH /api/user/company (Onboarding Company)
export const updateCompany = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id);
        const { isFreelance, address } = req.body;

        let company;

        if (isFreelance) {
            if (!user.nif || !user.name) return next(AppError.badRequest('Faltan datos personales (nombre y NIF)'));

            company = await Company.create({
                owner: user._id,
                name: user.fullName,
                cif: user.nif,
                address: address || user.address,
                isFreelance: true
            });
        } else {
            const { name, cif } = req.body;
            company = await Company.findOne({ cif });

            if (company) {
                user.role = 'guest';
            } else {
                company = await Company.create({ owner: user._id, name, cif, address });
            }
        }

        user.company = company._id;
        await user.save();
        res.status(200).json({ user, company });
    } catch (err) {
        next(err);
    }
};

// PATCH /api/user/logo
export const uploadCompanyLogo = async (req, res, next) => {
    try {
        if (!req.file) return next(AppError.badRequest('No se subió ningún archivo'));
        if (!req.user.company) return next(AppError.badRequest('Usuario sin compañía asociada'));

        const company = await Company.findByIdAndUpdate(
            req.user.company,
            { logo: req.file.path },
            { new: true }
        );
        res.status(200).json({ message: 'Logo actualizado', url: company.logo });
    } catch (err) {
        next(err);
    }
};

// GET /api/user
export const getUserProfile = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id).populate('company');
        res.status(200).json(user);
    } catch (err) {
        next(err);
    }
};

// POST /api/user/refresh
export const refreshToken = async (req, res, next) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) return next(AppError.unauthorized('Refresh token requerido'));

        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        const user = await User.findById(decoded._id);
        if (!user || user.deleted) return next(AppError.unauthorized('Usuario no válido'));

        const accessToken = jwt.sign(
            { _id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );
        res.status(200).json({ accessToken });
    } catch (err) {
        next(AppError.unauthorized('Token inválido o expirado'));
    }
};

// POST /api/user/logout
export const logout = async (req, res, next) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) return next(AppError.unauthorized('Refresh token requerido'));

        try {
            jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        } catch {
            return next(AppError.unauthorized('Token inválido'));
        }

        res.status(200).json({ message: 'Sesión cerrada correctamente' });
    } catch (err) {
        next(err);
    }
};

// DELETE /api/user
export const deleteUser = async (req, res, next) => {
    try {
        if (req.query.soft === 'true') {
            await User.findByIdAndUpdate(req.user._id, { deleted: true });
        } else {
            await User.findByIdAndDelete(req.user._id);
        }

        notificationService.emit('user:deleted', req.user._id);
        res.status(200).json({ message: 'Usuario eliminado' });
    } catch (err) {
        next(err);
    }
};

// PUT /api/user/password
export const changePassword = async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await User.findById(req.user._id).select('+password');

        if (!(await bcryptjs.compare(currentPassword, user.password))) {
            return next(AppError.badRequest('Contraseña actual incorrecta'));
        }

        user.password = await bcryptjs.hash(newPassword, 10);
        await user.save();
        res.status(200).json({ message: 'Contraseña actualizada' });
    } catch (err) {
        next(err);
    }
};

// POST /api/user/invite
export const inviteUser = async (req, res, next) => {
    try {
        const { email, name } = req.body;

        const tempPassword = crypto.randomBytes(8).toString('hex');
        const hash = await bcryptjs.hash(tempPassword, 10);

        const newUser = await User.create({
            email, name,
            password: hash,
            company: req.user.company,
            role: 'guest',
            status: 'pending'
        });

        notificationService.emit('user:invited', email);

        try {
            await sendVerificationEmail(email, `Tu contraseña temporal es: ${tempPassword}`);
        } catch {
            // No bloquear la invitación si el email falla
        }

        res.status(201).json({
            message: 'Usuario invitado',
            user: { email: newUser.email, name: newUser.name, role: newUser.role, status: newUser.status },
            temporaryPassword: tempPassword
        });
    } catch (err) {
        next(err);
    }
};
