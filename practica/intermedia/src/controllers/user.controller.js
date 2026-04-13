import User from '../models/user.model.js';
import Company from '../models/company.model.js';
import { encrypt, compare } from '../utils/handlePassword.js';
import { handleHttpError } from '../utils/handleError.js';
import { tokenSign, refreshTokenSign } from '../utils/handleJwt.js';
import jwt from 'jsonwebtoken';
import bcryptjs from 'bcryptjs';
import crypto from 'crypto';
import notificationService from '../services/notification.service.js';

// POST /api/user/register
export const register = async (req, res) => {
    try {
        const { email, password, name, lastName, nif, address } = req.body

        const existingUser = await User.findOne({ email: email, status: 'verified' })
        if (existingUser) {
            return handleHttpError(res, 'email_already_exists', 409)
        }

        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString()
        const hash = await encrypt(password)

        const newUser = {
            email,
            password: hash,
            name,
            lastName,
            nif,
            verificationCode,
            address,
        }

        const user = await User.create(newUser)

        const accessToken = tokenSign(user)
        const refreshToken = refreshTokenSign(user)

        if (notificationService) {
            notificationService.emit('user:registered', user)
        }

        const data = {
            accessToken,
            refreshToken,
            user: {
                email: user.email,
                status: user.status,
                role: user.role
            }
        }

        res.status(201).json(data)
    } catch (err) {
        console.log(err)
        return handleHttpError(res, 'error_register_user', 500)
    }
}

// PUT /api/user/validation
export const validateEmail = async (req, res) => {
    try {
        const { code } = req.body
        const user = await User.findById(req.user._id).select('+verificationCode +verificationAttempts')

        if (!user) {
            return handleHttpError(res, 'user_not_found', 404)
        }

        if (user.status === 'verified') return handleHttpError(res, 'validation_not_pending', 400)

        if (user.verificationAttempts <= 0) return handleHttpError(res, 'too_many_requests', 429)

        if (user.verificationCode === code) {
            user.status = 'verified'
            user.verificationCode = undefined
            await user.save()

            if (notificationService) {
                notificationService.emit('user:verified', user)
            }

            return res.status(200).json({ message: 'Email verificado' })
        } else {
            user.verificationAttempts -= 1
            await user.save()
            return handleHttpError(res, 'incorrect_verification_code', 400)
        }
    } catch (err) {
        return handleHttpError(res, 'error_validation_email', 500)
    }
}

// POST /api/user/login
export const login = async (req, res) => {
    try {
        const { email, password } = req.body
        const user = await User.findOne({ email: email, deleted: false }).select('+password')

        if (!user) {
            return handleHttpError(res, 'user_not_found_or_invalid', 404)
        }

        if (await compare(password, user.password)) {
            const accessToken = tokenSign(user)
            const refreshToken = refreshTokenSign(user)

            const data = {
                accessToken,
                refreshToken,
                user: {
                    email: user.email,
                    status: user.status,
                    role: user.role
                }
            }

            res.status(200).json(data)
        } else {
            return handleHttpError(res, 'invalid_credentials', 401)
        }
    } catch (err) {
        console.log(err)
        return handleHttpError(res, 'error_login', 500)
    }
}

// PUT /api/user/register (Onboarding personal)
export const updatePersonalData = async (req, res) => {
    try {
        const allowedFields = ['name', 'lastName', 'nif', 'address']
        const updateData = {}

        allowedFields.forEach(field => {
            if (req.body[field] !== undefined) {
                updateData[field] = req.body[field]
            }
        })

        const user = await User.findByIdAndUpdate(req.user._id, updateData, { new: true })
        res.status(200).json(user)
    } catch (err) {
        console.log(err)
        return handleHttpError(res, 'error_update_personal_data', 500)
    }
}

// PATCH /api/user/company (Onboarding Company)
export const updateCompany = async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
        const { isFreelance, address } = req.body

        let company

        if (isFreelance) {
            if (!user.nif || !user.name) {
                return handleHttpError(res, 'missing_personal_data', 400)
            }

            company = await Company.create({
                owner: user._id,
                name: user.fullName,
                cif: user.nif,
                address: address || user.address,
                isFreelance: true
            })
        } else {
            const { name, cif } = req.body
            company = await Company.findOne({ cif })

            if (company) {
                user.role = 'guest'
            } else {
                company = await Company.create({ owner: user._id, name, cif, address })
            }
        }

        user.company = company._id
        await user.save()
        res.status(200).json({ user, company })
    } catch (err) {
        console.log(err)
        return handleHttpError(res, 'error_update_company', 500)
    }
}

// PATCH /api/user/logo
export const uploadCompanyLogo = async (req, res) => {
    try {
        if (!req.file) return handleHttpError(res, 'no_file_uploaded', 400)
        if (!req.user.company) return handleHttpError(res, 'no_company_associated', 400)

        const company = await Company.findByIdAndUpdate(
            req.user.company,
            { logo: req.file.path },
            { new: true }
        )
        res.status(200).json({ message: 'Logo actualizado', url: company.logo })
    } catch (err) {
        console.log(err)
        return handleHttpError(res, 'error_upload_logo', 500)
    }
}

// GET /api/user
export const getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate('company')
        res.status(200).json(user)
    } catch (err) {
        console.log(err)
        return handleHttpError(res, 'error_get_profile', 500)
    }
}

// POST /api/user/refresh
export const refreshToken = async (req, res) => {
    try {
        const { refreshToken } = req.body
        if (!refreshToken) return handleHttpError(res, 'refresh_token_required', 401)

        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET)
        const user = await User.findById(decoded._id)

        if (!user || user.deleted) throw new Error()

        const accessToken = jwt.sign(
            { _id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        )
        res.status(200).json({ accessToken })
    } catch (err) {
        console.log(err)
        return handleHttpError(res, 'invalid_or_expired_token', 401)
    }
}

// POST /api/user/logout
export const logout = async (req, res) => {
    try {
        const { refreshToken } = req.body

        if (!refreshToken) {
            return handleHttpError(res, 'refresh_token_required', 401)
        }

        try {
            jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET)
        } catch (err) {
            console.log(err)
            return handleHttpError(res, 'invalid_token', 401)
        }

        res.status(200).json({ message: 'Sesión cerrada correctamente' })
    } catch (err) {
        console.log(err)
        return handleHttpError(res, 'error_logout', 500)
    }
}

// DELETE /api/user
export const deleteUser = async (req, res) => {
    try {
        const isSoft = req.query.soft === 'true'
        if (isSoft) {
            await User.findByIdAndUpdate(req.user._id, { deleted: true })
        } else {
            await User.findByIdAndDelete(req.user._id)
        }

        if (notificationService) {
            try {
                notificationService.emit('user:deleted', req.user._id)
            } catch (emitErr) {
                console.log(err)
                console.error('Error emitiendo evento user:deleted:', emitErr)
            }
        }

        res.status(200).json({ message: 'Usuario eliminado' })
    } catch (err) {
        console.log(err)
        return handleHttpError(res, 'error_delete_user', 500)
    }
}

// PUT /api/user/password
export const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body
        const user = await User.findById(req.user._id).select('+password')

        if (!(await bcryptjs.compare(currentPassword, user.password))) {
            return handleHttpError(res, 'incorrect_current_password', 400)
        }

        user.password = await bcryptjs.hash(newPassword, 10)
        await user.save()
        res.status(200).json({ message: 'Contraseña actualizada' })
    } catch (err) {
        console.log(err)
        return handleHttpError(res, 'error_change_password', 500)
    }
}

// POST /api/user/invite
export const inviteUser = async (req, res) => {
    try {
        const { email, name } = req.body

        const tempPassword = crypto.randomBytes(8).toString('hex')
        const hash = await bcryptjs.hash(tempPassword, 10)

        const newUser = await User.create({
            email,
            name,
            password: hash,
            company: req.user.company,
            role: 'guest',
            status: 'pending'
        })

        if (notificationService) {
            notificationService.emit('user:invited', email)
        }

        res.status(201).json({
            message: 'Usuario invitado',
            user: {
                email: newUser.email,
                name: newUser.name,
                role: newUser.role,
                status: newUser.status
            },
            temporaryPassword: tempPassword
        })
    } catch (err) {
        console.log(err)
        return handleHttpError(res, 'error_invite_user', 500)
    }
}
