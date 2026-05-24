require('dotenv').config();
const http = require('http');
const app = require('./src/app');
const connectDB = require('./src/config/db');
const registerSocket = require('./src/socket');

connectDB();

const server = http.createServer(app);
const io = registerSocket(server);
app.set('io', io);

server.listen(process.env.PORT || 3000, () => {
  console.log(`Server running on port ${process.env.PORT || 3000}`);
});