import mongoose from 'mongoose';

const workerSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        hours: { type: Number, required: true, min: 0 }
    },
    { _id: false }
);

const deliveryNoteSchema = new mongoose.Schema(
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
        project: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Project',
            required: true,
            index: true
        },
        format: {
            type: String,
            enum: { values: ['material', 'hours'], message: 'Formato debe ser material u hours' },
            required: [true, 'Formato requerido']
        },
        description: {
            type: String,
            trim: true
        },
        workDate: {
            type: Date,
            required: [true, 'Fecha de trabajo requerida']
        },
        // Campos para format: 'material'
        material: { type: String, trim: true },
        quantity: { type: Number, min: 0 },
        unit: { type: String, trim: true },
        // Campos para format: 'hours'
        hours: { type: Number, min: 0 },
        workers: [workerSchema],
        // Firma
        signed: { type: Boolean, default: false, index: true },
        signedAt: { type: Date },
        signatureUrl: { type: String },
        pdfUrl: { type: String },
        deleted: { type: Boolean, default: false, index: true }
    },
    { timestamps: true }
);

export default mongoose.model('DeliveryNote', deliveryNoteSchema);
