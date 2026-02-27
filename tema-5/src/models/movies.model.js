import mongoose from 'mongoose';

const currentYear = new Date().getFullYear()

const movieSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, 'Titulo requerido'],
            minLength: [2, 'Mínimo 2 caracteres']
        },
        director: {
            type: String,
            required: [true, 'Director requerido'],
            minLength: [2, 'Mínimo 2 caracteres']
        },
        year: {
            type: Number,
            min: [1888, 'El año tiene que ser mayor que 1888'],
            max: [currentYear, 'El año no puede ser mayor que el actual']
        },
        genre: {
            type: String,
            enum: {
                values: ['Accion', 'Comedia', 'Drama', 'Terror', 'Sci-Fi'],
                message: '{VALUE} no es un género válido'
            },
            trim: true
        },
        copies: {
            type: Number,
            default: 5
        },
        availableCopies: {
            type: Number
        },
        timesRented: {
            type: Number,
            default: 0
        },
        cover: {
            type: String,
            default: null
        }
    })

export default mongoose.model('Movie', movieSchema)
