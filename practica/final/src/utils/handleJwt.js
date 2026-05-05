import jwt from 'jsonwebtoken';

export const tokenSign = (user) => {
    return jwt.sign(
        { _id: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
    );
};

export const refreshTokenSign = (user) => {
    return jwt.sign(
        { _id: user._id, role: user.role },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
    );
};

export const verifyToken = (tokenJwt) => {
    try {
        return jwt.verify(tokenJwt, process.env.JWT_SECRET);
    } catch {
        return null;
    }
};
