import { ZodError } from 'zod';

export const validate = (schema) => async (req, res, next) => {
  try {
    const result = await schema.parseAsync({
      body: req.body,
      query: req.query,
      params: req.params
    });

    req.body = result.body;
    if (result.query) Object.assign(req.query, result.query);
    if (result.params) Object.assign(req.params, result.params);

    next();
  } catch (error) {
    // 1. COMPROBACIÓN DEFENSIVA:
    // Verificamos si es un ZodError O si simplemente tiene un array .errors
    if (error instanceof ZodError || (error.errors && Array.isArray(error.errors))) {
      
      const errors = error.errors.map(err => ({
        // Usamos path[1] para mostrar el campo limpio (ej: 'title' en vez de 'body.title')
        // Si path[1] no existe, usamos path[0]
        campo: err.path[1] || err.path[0], 
        mensaje: err.message
      }));
      
      return res.status(400).json({
        error: 'Datos inválidos',
        detalles: errors
      });
    }

    // 2. Si no es un error de validación, dejamos que explote controladamente
    next(error);
  }
};
