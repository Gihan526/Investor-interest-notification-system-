import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";

const app = express();
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer);

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

io.on("connection", (socket) => {
  console.log("socket connected:", socket.id);
});

httpServer.listen(3000, () => {
  console.log("server running on port 3000");
});

export { io };
