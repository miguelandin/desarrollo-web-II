import mongoose from 'mongoose';

const dbConnect = async () => {
  const DB_URI = process.env.NODE_ENV === 'test' 
    ? process.env.MONGODB_TEST_URI 
    : process.env.MONGODB_URI;

  try {
    await mongoose.connect(DB_URI);
    console.log('*** CONEXIÓN CORRECTA ***');
  } catch (err) {
    console.log('*** ERROR DE CONEXIÓN ***', err);
  }
};

export default dbConnect;
