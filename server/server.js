require('dns').setDefaultResultOrder('ipv4first');
const http = require('http');
const app = require('./src/app');
const connectDB = require('./src/config/db');
const initSocket = require('./src/sockets/index');
const { port } = require('./src/config/env');

const httpServer = http.createServer(app);
initSocket(httpServer);
connectDB().then(() => {
  httpServer.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
});