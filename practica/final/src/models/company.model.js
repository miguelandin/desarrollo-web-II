import mongoose from 'mongoose';

const companySchema = new mongoose.Schema(
    {
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        name: {
            type: String,
            minlength: [2, "Nombre de la compañia demasiado corto"],
            required: true
        },
        cif: {
            type: String,
            required: true,
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
        logo: {
            type: String,
        },
        isFreelance: {
            type: Boolean,
        },
        deleted: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true
    }
)

companySchema.index({ cif: 1 }, { unique: true, partialFilterExpression: { deleted: false } });

export default mongoose.model('Company', companySchema)
