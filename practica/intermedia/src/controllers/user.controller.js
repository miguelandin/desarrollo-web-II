import User from '../models/user.model';
import Company from '../models/company.model';
import { encrypt } from '../utils/handlePassword';
import { handleHttpError } from '../utils/handleError';
import { tokenSign, refreshTokenSign } from '../utils/handleJwt';

// POST /api/user/register
export const register = async (req, res) => {
    try {
        const { email, password, name, lastName, nif, address, isFreelance } = req.body

        const existingUser = await User.findOne({ email: email, status: 'verified' })
        if (existingUser) {
            return handleHttpError(res, 'email_already_exists', 409)
        }

        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString()
        const hash = await encrypt(password)
        const newUser = {
            email: email,
            password: hash,
            name: name,
            lastName: lastName,
            nif: nif,
            verificationCode: verificationCode,
            address: address,
        }

        const user = await User.create(newUser)

        if (isFreelance) {
            const company = await Company.create({
                owner: user._id,
                name: `${name} ${lastName || ''}`.trim(),
                cif: nif,
                address: address,
                isFreelance: isFreelance
            })

            user.company = company._id
            await user.save()
        }
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

        res.status(201).json(data)
    } catch (err) {
        handleHttpError(res, 'error_register_user')
    }
}
