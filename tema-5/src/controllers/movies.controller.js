import Movie from '../models/movies.model.js'
import Storage from '../models/storage.model.js'
import { asyncHandler, errors } from '../utils/handleError.js'

const PUBLIC_URL = process.env.PUBLIC_URL || 'http://localhost:3000'

// GET /api/movies?genre
export const getMovies = asyncHandler(async (req, res) => {
    const { genre } = req.query

    const filter = genre ? { genre } : {}

    const movies = await Movie.find(filter)

    res.status(200).json({ data: movies })
})

// GET /api/movies:id
export const getMovieById = asyncHandler(async (req, res) => {
    const { id } = req.params
    const movie = await Movie.findById(id)

    if (!movie) {
        throw errors.notFound('Película')
    }

    res.status(200).json({ data: movie })
})

// GET /api/movies/stats/top
export const getTopMovies = asyncHandler(async (req, res) => {
    const topMovies = await Movie.find().sort({ timesRented: -1 }).limit(5)
    res.status(200).json({ data: topMovies })
})

// GET /api/movies/:id/cover
export const getMovieCover = asyncHandler(async (req, res) => {
    const movie = await Movie.findById(req.params.id)

    if (!movie)
        throw errors.notFound('película')
    if (!movie.cover)
        throw errors.notFound('cover no encontrada')

    res.status(200).json({ data: { cover: movie.cover } })
})

// POST /api/movies
export const createMovie = asyncHandler(async (req, res) => {
    const movie = await Movie.create(req.body)
    res.status(201).json({ data: movie })
})

// PUT /api/movies/:id
export const updateMovie = asyncHandler(async (req, res) => {
    const movie = await Movie.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
    )

    if (!movie)
        throw errors.notFound('película')

    res.status(200).json({ data: movie })
})

// DELETE /api/movies/:id
export const deleteMovie = asyncHandler(async (req, res) => {
    const movie = await Movie.findByIdAndDelete(req.params.id)

    if (!movie)
        throw errors.notFound('película')

    res.status(204).send()
})

// PATCH /api/movies/:id/rent
export const rentMovie = asyncHandler(async (req, res) => {
    const movie = await Movie.findById(req.params.id)

    if (!movie) throw errors.notFound('película')

    if (movie.availableCopies <= 0)
        throw errors.badRequest('No hay copias disponibles para alquilar')

    movie.availableCopies -= 1
    movie.timesRented += 1

    await movie.save()
    res.status(200).json({ data: movie, message: 'Película alquilada' })
})

// PATCH /api/movies/:id/return
export const returnMovie = asyncHandler(async (req, res) => {
    const movie = await Movie.findById(req.params.id)

    if (!movie) throw errors.notFound('película')

    if (movie.availableCopies >= movie.copies)
        throw errors.badRequest('No puedes devolver más películas de las que tiene el videoclub')

    movie.availableCopies += 1

    await movie.save()
    res.status(200).json({ data: movie, message: 'Película devuelta' })
})

// PATCH /api/movies/:id/cover
export const uploadCover = asyncHandler(async (req, res) => {
    if (!req.file) {
        throw errors.badRequest('No se subió ninguna imagen')
    }

    const fileData = await Storage.create({
        filename: req.file.filename,
        originalName: req.file.originalname,
        url: `${PUBLIC_URL}/uploads/${req.file.filename}`,
        mimetype: req.file.mimetype,
        size: req.file.size
    })

    const movie = await Movie.findByIdAndUpdate(
        req.params.id,
        { cover: fileData.url },
        { new: true, runValidators: true }
    )

    if (!movie) {
        throw errors.notFound('Película')
    }

    res.status(200).json({ data: movie, message: 'Carátula actualizada correctamente' })
})
