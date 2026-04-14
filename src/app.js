const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const app = express();

// Middleware
app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(morgan('dev'));

// Routes
const authRoutes = require('./modules/auth/auth.route');
const userRoutes = require('./modules/user/user.route');
const brandRoutes = require('./modules/brand/brand.route');
const categoryRoutes = require('./modules/category/category.route');

app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/brands', brandRoutes);
app.use('/categories', categoryRoutes);

// Test
app.get('/', (req, res) => {
  res.send('Welcome to the Sneaker Cop API!');
});

module.exports = app;