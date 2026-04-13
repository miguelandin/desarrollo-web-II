import app from './app.js';

const PORT = process.env.PORT;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Entorno: ${process.env.NODE_ENV || 'development'}`);
});