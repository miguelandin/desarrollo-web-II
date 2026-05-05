import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, "e-mail no válido"],
            index: true
        },
        password: {
            type: String,
            required: [true, 'Contraseña requerida'],
            minLength: [8, 'Mínimo 8 caracteres'],
            select: false
        },
        name: {
            type: String,
        },
        lastName: {
            type: String
        },
        nif: {
            type: String,
        },
        role: {
            type: String,
            enum: {
                values: ['admin', 'guest'],
                message: 'El rol debe de ser admin o guest'
            },
            default: 'admin',
            index: true
        },
        status: {
            type: String,
            enum: ['pending', 'verified'],
            default: 'pending',
            index: true
        },
        verificationCode: {
            type: String,
            default: null,
            select: false,
            minlength: 6,
            maxlength: 6
        },
        verificationAttempts: {
            type: Number,
            default: 3,
            min: [1, 'Maximo número de intentos']
        },
        company: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Company',
            index: true
        },
        address: {
            street: {
                type: String
            },
            number: {
                type: String
            }
            , postal: {
                type: String
            },
            city: {
                type: String
            },
            province: {
                type: String
            }
        },
        deleted: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true,
        toJSON: { virtuals: true }
    }
)

userSchema.virtual('fullName').get(function() {
    return `${this.name} ${this.lastName || ''}`.trim();
});

export default mongoose.model('User', userSchema)
