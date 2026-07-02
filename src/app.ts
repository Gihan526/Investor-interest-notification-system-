import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import authRoutes from "./routes/auth";
import interestRoutes from "./routes/interests";
import notificationRoutes from "./routes/notifications";
import { redisSub } from "./lib/redis";

const app = express();
app.use(express.json());

const httpServer = createServer(app);
export const io = new Server(httpServer);

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/interests", interestRoutes);
app.use("/api/notifications", notificationRoutes);

// founders join a room with their userId on connect
io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId as string;
  if (userId) socket.join(userId);
});

// relay Redis events to the right founder via Socket.IO
redisSub.subscribe("new_interest");
redisSub.on("message", (_channel, message) => {
  const { founderId, notification } = JSON.parse(message);
  io.to(founderId).emit("new_interest", notification);
});

httpServer.listen(3000, () => {
  console.log("server running on port 3000");
});
