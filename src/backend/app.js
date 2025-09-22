const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const app = express();

const authRoutes = require('./routes/authRoutes');
const protectedRoutes = require('./routes/protectedRoutes');
const patientRoutes = require('./routes/patientRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const messageRoutes = require('./routes/messageRoutes');

app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/protected', protectedRoutes);
app.use('/api/protected/patients', patientRoutes);
app.use('/api/protected/appointments', appointmentRoutes);
app.use('/api/protected/messages', messageRoutes);

app.get('/', (req, res) => {
  res.send('TMIS Auth Backend Running...');
});

module.exports = app;
