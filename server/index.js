const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/data', require('./routes/data'));
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Serve React build
const dist = path.join(__dirname, '../dist');
app.use(express.static(dist));
app.get('*', (req, res) => {
  res.sendFile(path.join(dist, 'index.html'));
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server chạy tại http://localhost:${PORT}`);
});
