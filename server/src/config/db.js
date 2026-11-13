import mongoose from 'mongoose';

// Unknown filter keys are dropped. User input used in filters is always coerced to strings in routes.
mongoose.set('strictQuery', true);

export async function connectDB() {
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error('MONGO_URI is not set. Copy server/.env.example to server/.env');
  await mongoose.connect(uri);
  console.log(`MongoDB connected: ${mongoose.connection.host}/${mongoose.connection.name}`);
}
