require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());


// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/salesdb', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

// Import analytics and data refresh routes
const analyticsRoutes = require('./routes/analytics');
app.use('/api', analyticsRoutes);

app.get('/', (req, res) => {
  res.send('Sales Data Analytics API');
});

// Optionally, schedule daily data refresh (uncomment and set CSV path)
 const { scheduleDailyRefresh } = require('./jobs/dataRefreshJob');
 scheduleDailyRefresh('data/tableConvert.com_daylj9.csv');

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});