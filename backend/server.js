require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');

const authMiddleware = require('./middlewares/authMiddleware');
const authController = require('./controllers/authController');

const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const userOwnerRoutes = require('./routes/userOwnerRoutes');
const configurationItemRoutes = require('./routes/configurationItemsRoutes');
const assignmentRoutes = require('./routes/assignmentRoutes');
const letterRoutes = require('./routes/letterRoutes');

const app = express();

const allowedOrigins = (process.env.FRONTEND_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        return callback(null, true);
      }
      if (allowedOrigins.includes(origin) || /^http:\/\/localhost:\d+$/.test(origin)) {
        return callback(null, origin);
      }
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json({ limit: '5mb' }));

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);

app.use('/api', authMiddleware);

app.use('/api/admins', adminRoutes);
app.use('/api/users', userOwnerRoutes);
app.use('/api/cis', configurationItemRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/letters', letterRoutes);

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const PORT = process.env.PORT || 3000;

async function start() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    await authController.ensureDefaultAdmin();
    app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();

module.exports = app;
