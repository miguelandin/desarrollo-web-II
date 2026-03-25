import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            minLength: [2, "El nombre tiene que tener mínimo 2 letras"]
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, "Mail not valid"]
        },
        password: {
            type: String,
            required: true,
            minLength: [8, "La contraseña tiene que tener mínimo 8 letras"],
            select: false
        },
        role: {
            type: String,
            enum: ['user', 'admin'],
            default: 'user'
        }
    },
    {
        timestamps: true,
        versionKey: false
    }
);

userSchema.pre('save', async function(next) {
    if (!this.isModified('password'))
        return next()
    try {
        const salt = await bcrypt.genSalt(10)
        this.password = await bcrypt.hash(this.password, salt)
        next()
    } catch (error) {
        next(error)
    }
});

export default mongoose.model('User', userSchema);
