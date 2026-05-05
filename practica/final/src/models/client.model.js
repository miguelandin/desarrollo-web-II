import mongoose from 'mongoose';

const clientSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true
        },
        company: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Company',
            required: true,
            index: true
        },
        name: {
            type: String,
            required: [true, 'Nombre del cliente requerido'],
            minlength: [2, 'Nombre demasiado corto'],
            trim: true
        },
        cif: {
            type: String,
            required: [true, 'CIF requerido'],
            trim: true,
            uppercase: true
        },
        email: {
            type: String,
            lowercase: true,
            trim: true
        },
        phone: {
            type: String,
            trim: true
        },
        address: {
            street: String,
            number: String,
            postal: String,
            city: String,
            province: String
        },
        deleted: {
            type: Boolean,
            default: false,
            index: true
        }
    },
    { timestamps: true }
);

clientSchema.index({ company: 1, cif: 1 }, { unique: true, partialFilterExpression: { deleted: false } });

export default mongoose.model('Client', clientSchema);
