const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const env = require('./config/env');
const AppError = require('./utils/AppError');
const errorHandler = require('./middleware/errorHandler');
const v1Routes = require('./routes/v1');

const app = express();

// 1. GLOBAL MIDDLEWARES
// Security HTTP headers
app.use(helmet());

// Development logging
if (env.nodeEnv === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Limit requests from same API
const limiter = rateLimit({
  max: 1000, // 1000 requests per IP
  windowMs: 60 * 60 * 1000, // 1 hour
  message: 'Too many requests from this IP, please try again in an hour!'
});
app.use('/api', limiter);

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// CORS setup
const corsOptions = {
  origin: env.nodeEnv === 'development' ? ['http://localhost:5173', 'http://127.0.0.1:5173'] : false, // False in prod until strictly configured
  credentials: true
};
app.use(cors(corsOptions));

// 2. ROUTES
app.use('/api/v1', v1Routes);

// Handle unknown routes
app.use((req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// 3. GLOBAL ERROR HANDLER
app.use(errorHandler);

module.exports = app;
