require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Backend is running' });
});

const PORT = process.env.PORT || 5000;

// Delay DB connection for later when implementing features
// mongoose.connect(process.env.MONGO_URI);

if (require.main === module) {
  const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    // Optional: exit cleanly after 1 sec to allow check script to verify it starts
    if (process.env.TEST_STARTUP) {
      setTimeout(() => server.close(() => process.exit(0)), 1000);
    }
  });
}

module.exports = app;
