import mongoose from 'mongoose';

const podcastSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            minLength: [3, "El título tiene que tener mínimo 3 letras"],
            trim: true
        },
        description: {
            type: String,
            required: true,
            minLength: [10, "La descripción tiene que tener mínimo 10 letras"]
        },
        author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        category: {
            type: String,
            enum: ['tech', 'science', 'history', 'comedy', 'news']
        },
        duration: {
            type: Number,
            required: true,
            min: [60, "El podcast debe de durar mínimo 60 segundos"]
        },
        episodes: {
            type: Number,
            default: 1
        },
        published: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true,
        versionKey: false
    }
);

export default mongoose.model('Podcast', podcastSchema);
