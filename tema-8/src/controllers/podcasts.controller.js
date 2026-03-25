import Podcast from '../models/podcast.model.js';
import { handleHttpError } from '../utils/handleError.js';

// GET /api/podcasts (public)
export const getPodcasts = async (req, res) => {
    try {
        const podcasts = await Podcast.find({ published: true }).populate('author', 'name email');
        res.json({ data: podcasts });
    } catch (err) {
        handleHttpError(res, 'ERROR_GET_PODCASTS');
    }
};

// GET /api/podcasts/:id (public)
export const getPodcast = async (req, res) => {
    try {
        const { id } = req.params;
        const podcast = await Podcast.findByOne({ _id: id, published: true }).populate('author', 'name email');

        if (!podcast) {
            return handleHttpError(res, 'PODCAST_NOT_FOUND', 404);
        }

        res.json({ data: podcast });
    } catch (err) {
        handleHttpError(res, 'ERROR_GET_PODCAST');
    }
};

// POST /api/podcasts (user)
export const createPodcast = async (req, res) => {
    try {
        const body = {
            ...req.body,
            author: req.user._id
        };

        const podcast = await Podcast.create(body);
        res.status(201).json({ data: podcast });
    } catch (err) {
        handleHttpError(res, 'ERROR_CREATE_PODCAST');
    }
};

// PUT /api/podcasts/:id (creator)
export const updatePodcast = async (req, res) => {
    try {
        const { id } = req.params;

        const podcast = await Podcast.findOneAndUpdate(
            { _id: id, author: req.user._id },
            req.body,
            { new: true }
        )

        if (!podcast) {
            return handleHttpError(res, 'PODCAST_NOT_FOUND', 404);
        }

        res.json({ data: podcast });
    } catch (err) {
        handleHttpError(res, 'ERROR_UPDATE_PODCAST');
    }
};

// DELETE /api/podcasts/:id (admin)
export const deletePodcast = async (req, res) => {
    try {
        const { id } = req.params;

        const podcast = await Podcast.findByIdAndDelete(id);

        if (!podcast) {
            return handleHttpError(res, 'PODCAST_NOT_FOUND', 404);
        }

        res.json({ message: 'Podcast eliminado', data: podcast });
    } catch (err) {
        handleHttpError(res, 'ERROR_DELETE_PODCAST');
    }
};


// GET /api/podcasts/admin/all (admin)
export const getAllPodcasts = async (req, res) => {
    try {
        const podcasts = await Podcast.find({}).populate('author', 'name email')
        res.json({ data: podcasts })
    } catch (err) {
        handleHttpError(res, 'ERROR_GET_ALL_PODCASTS')
    }
}

// PATCH /api/podcasts/:id/publish (admin)
export const publishPodcast = async (req, res) => {
    try {
        const { id } = req.params;

        const podcast = await Podcast.findById(id);

        if (!podcast) {
            return handleHttpError(res, 'PODCAST_NOT_FOUND', 404);
        }

        podcast.published = !podcast.published;
        await podcast.save();

        res.json({ message: `Podcast ${podcast.published ? 'publicado' : 'despublicado'}`, data: podcast });
    } catch (err) {
        handleHttpError(res, 'ERROR_TOGGLE_PUBLISH_PODCAST');
    }
};
