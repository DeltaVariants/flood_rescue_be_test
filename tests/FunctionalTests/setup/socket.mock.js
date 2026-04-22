import { io as Client } from "socket.io-client";
import { createServer } from "http";
import app from "../../../src/app.js";
import { Server } from "socket.io";
// Giả định logic socket thật của bạn được load từ đây:
// import initializeSockets from "../../../src/sockets/...";

/**
 * Helper thiết lập môi trường test WebSocket (dành cho phần M1 của Duy).
 * Quay vòng một local server HTTP port ảo để chạy Jest mà không trùng port 8080 chính.
 */
export const setupSocketTestEnv = (done) => {
  const httpServer = createServer(app);
  const io = new Server(httpServer);
  
  // Nơi nhúng logic socket server thực tế của project:
  // initializeSockets(io); 

  httpServer.listen(() => {
    const port = httpServer.address().port;
    const clientSocket = new Client(`http://localhost:${port}`);
    
    // Cấp phát globals io để các Controller bắn notification bắt được (tuỳ kiến trúc)
    global.io = io;
    
    clientSocket.on("connect", () => {
      done({ io, clientSocket, httpServer });
    });
  });
};

export const teardownSocketTestEnv = ({ io, clientSocket, httpServer }) => {
  if (io) io.close();
  if (clientSocket) clientSocket.close();
  if (httpServer) httpServer.close();
  global.io = undefined; // Reset
};
