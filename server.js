const PORT = process.env.PORT || 5000;

const path = require("path");
const http = require("http");
const express = require("express");
const cors = require("cors");
const socketio = require("socket.io");

const app = express();
app.use(express.urlencoded({ extended: false }));

const server = http.createServer(app);
const io = socketio(server, {
  cors: {
    origin: "https://tomperchat.netlify.app",
    methods: ["GET", "POST"],
  },
});

const BOT = "BOT";

function formatMessage(username, text) {
  return {
    username,
    text,
  };
}

let users = [];

io.on("connection", (socket) => {
  //ON NEW USER JOIN
  socket.on("new-user", ({ username, room }) => {
    users.push({ id: socket.id, name: username, room: room });
    console.log(users);
    socket.join(room);
    socket.emit("chat-message", formatMessage(BOT, "welcome to varta!"));
    socket.broadcast
      .to(room)
      .emit("chat-message", formatMessage(BOT, `${username} joined`));
    const connectedUsers = users.filter((user) => user.room === room);
    io.to(room).emit("connected-users", connectedUsers);
  });

  //ON NEW CHAT MESSAGE
  socket.on("chat-message", (message) => {
    let user = users.find((user) => user.id === socket.id);
    if (user) {
      io.to(user.room).emit("chat-message", formatMessage(user.name, message));
    }
  });

  //ON USER-DISCONNECT
  socket.on("disconnect", () => {
    let user = users.find((user) => user.id === socket.id);
    if (user) {
      socket.broadcast
        .to(user.room)
        .emit("chat-message", formatMessage(BOT, `${user.name} left`));
      users = users.filter((user) => user.id != socket.id);
      const connectedUsers = users.filter((_user) => _user.room === user.room);
      io.to(user.room).emit("connected-users", connectedUsers);
    }
  });
});

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
