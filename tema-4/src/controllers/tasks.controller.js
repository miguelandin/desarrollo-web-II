import { tasks } from '../data/tasks.js'
import { ApiError } from '../middleware/errorHandler.js'

const prioritys = {
    'high': 3,
    'medium': 2,
    'low': 1
}

// GET /api/tasks
export const getAll = (req, res) => {
    let result = [...tasks]
    const { priority } = req.query

    if (priority)
        result = result.filter(t => t.priority === priority)
    result.sort((a, b) => prioritys[b.priority] - prioritys[a.priority])

    res.json(result)

}

// GET /api/tasks/:id
export const getById = (req, res) => {
    const id = parseInt(req.params.id)
    const task = tasks.find(c => c.id === id)

    if (!task)
        throw ApiError.notFound(`Task with ID ${id} not found`)

    res.json(task)
}

// POST /api/tasks/
export const create = (req, res) => {
    const { title, description, priority, completed, date } = req.body
    const newTask = {
        id: tasks.length > 0 ? tasks[tasks.length - 1].id + 1 : 1,
        title,
        description,
        completed,
        priority,
        date
    }

    tasks.push(newTask)
    res.status(201).json(newTask)
}

// PUT /api/tasks
export const update = (req, res) => {
    const id = parseInt(req.params.id)
    const index = tasks.findIndex(t => t.id === id)

    if (index === -1)
        throw ApiError.notFound(`Task with ID ${id} not found`)

    const { title, description, priority, completed, date } = req.body

    tasks[index] = {
        id,
        title,
        description,
        priority,
        completed,
        date
    }

    res.json(tasks[index])
}

// PATCH /api/tasks/:id
export const partialUpdate = (req, res) => {
    const id = parseInt(req.params.id)
    const index = tasks.findIndex(t => t.id === id)

    if (index === -1)
        throw ApiError.notFound(`Tasks with ID ${id} not found`)

    tasks[index] = {
        ...tasks[index],
        ...req.body,
        id: id // make sure to have the original id
    }

    res.json(tasks[index])
}

// DELETE /api/tasks/:id
export const remove = (req, res) => {
    const id = parseInt(req.params.id)
    const index = tasks.findIndex(t => t.id === id)

    if (index === -1)
        throw ApiError.notFound(`Tasks with ID ${id} not found`)

    tasks.splice(index, 1)
    res.status(204).end()
}
