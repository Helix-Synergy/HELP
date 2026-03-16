const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');

// Load env vars
dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(helmet({
  crossOriginResourcePolicy: false // Allow loading images from same origin
}));
app.use(morgan('dev'));
app.use(cookieParser());

// Serve static directory for uploads
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Database connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/hems')
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.error('MongoDB connection error:', err));

const errorHandler = require('./middleware/error');

// Routes
app.use('/api/v1/auth', require('./routes/auth'));
app.use('/api/v1/users', require('./routes/users'));
app.use('/api/v1/attendance', require('./routes/attendance'));
app.use('/api/v1/leaves', require('./routes/leaves'));
app.use('/api/v1/documents', require('./routes/documents'));
app.use('/api/v1/projects', require('./routes/projects'));
app.use('/api/v1/timesheets', require('./routes/timesheets'));
app.use('/api/v1/onboarding', require('./routes/onboarding'));
app.use('/api/v1/performance', require('./routes/performance'));
app.use('/api/v1/payroll', require('./routes/payroll'));
app.use('/api/v1/helpdesk', require('./routes/helpdesk'));
app.use('/api/v1/assets', require('./routes/assets'));
app.use('/api/v1/learning', require('./routes/learning'));

// Basic health check
app.get('/', (req, res) => {
  res.send('HEMS API is running...');
});

// Global error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
