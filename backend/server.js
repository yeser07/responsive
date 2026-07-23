require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');

const { assertSecretsConfigured } = require('./utils/authCookies');
const authMiddleware = require('./middlewares/authMiddleware');
const authController = require('./controllers/authController');

const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const userOwnerRoutes = require('./routes/userOwnerRoutes');
const configurationItemRoutes = require('./routes/configurationItemsRoutes');
const assignmentRoutes = require('./routes/assignmentRoutes');
const letterRoutes = require('./routes/letterRoutes');
const reportsRoutes = require('./routes/reportsRoutes');
const auditRoutes = require('./routes/auditRoutes');
const searchRoutes = require('./routes/searchRoutes');
const exportRoutes = require('./routes/exportRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const attachmentRoutes = require('./routes/attachmentRoutes');

assertSecretsConfigured();

const app = express();

const allowedOrigins = (process.env.FRONTEND_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

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
  const dbState = mongoose.connection.readyState;
  const dbReady = dbState === 1;
  res.status(dbReady ? 200 : 503).json({
    status: dbReady ? 'ok' : 'degraded',
    mongo: dbReady ? 'connected' : 'disconnected',
  });
});

app.use('/api/auth', authRoutes);

app.use('/api', authMiddleware);

app.use('/api/admins', adminRoutes);
app.use('/api/users', userOwnerRoutes);
app.use('/api/cis', configurationItemRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/reviewers', require('./routes/reviewerRoutes'));
app.use('/api/letters', letterRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/attachments', attachmentRoutes);

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

if (require.main === module) {
  start();
}

module.exports = app;
