import { Router } from 'express'
import {
    getMovies,
    getMovieById,
    getTopMovies,
    getMovieCover,
    createMovie,
    updateMovie,
    deleteMovie,
    rentMovie,
    returnMovie,
    uploadCover
} from '../controllers/movies.controller.js'
import { validate, validateObjectId } from '../middleware/validate.middleware.js'
import { createMovieSchema, updateMovieSchema } from '../schemas/movie.schema.js'
import multer from 'multer'
import { join } from 'node:path'

const router = Router()
const upload = multer({ dest: join(process.cwd(), 'uploads') })

router.get('/', getMovies)
router.get('/top', getTopMovies)
router.get('/:id', validateObjectId(), getMovieById)
router.get('/:id/cover', validateObjectId(), getMovieCover)
router.post('/', validate(createMovieSchema), createMovie)
router.put('/:id', validate(updateMovieSchema), updateMovie)
router.put('/:id/rent', validateObjectId(), rentMovie)
router.put('/:id/return', validateObjectId(), returnMovie)
router.put('/:id/cover', validateObjectId(), upload.single('cover'), uploadCover)
router.delete('/:id', validateObjectId(), deleteMovie)

export default router
