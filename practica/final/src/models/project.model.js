import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema(
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
        client: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Client',
            required: true,
            index: true
        },
        name: {
            type: String,
            required: [true, 'Nombre del proyecto requerido'],
            trim: true
        },
        projectCode: {
            type: String,
            required: [true, 'Código de proyecto requerido'],
            trim: true,
            uppercase: true
        },
        address: {
            street: String,
            number: String,
            postal: String,
            city: String,
            province: String
        },
        email: {
            type: String,
            lowercase: true,
            trim: true
        },
        notes: {
            type: String,
            trim: true
        },
        active: {
            type: Boolean,
            default: true,
            index: true
        },
        deleted: {
            type: Boolean,
            default: false,
            index: true
        }
    },
    { timestamps: true }
);

projectSchema.index({ company: 1, projectCode: 1 }, { unique: true, partialFilterExpression: { deleted: false } });

export default mongoose.model('Project', projectSchema);
