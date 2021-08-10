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
    origin: "*",
    methods: ["GET", "POST"],
    allowedHeaders: ["my-custom-header"],
    credentials: true,
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
  socket.on("new-user", (username) => {
    socket.emit("chat-message", formatMessage(BOT, "welcome to varta!"));
    socket.broadcast.emit(
      "chat-message",
      formatMessage(BOT, `${username} joined`)
    );
    users.push({ id: socket.id, name: username });
    io.emit("connected-users", users);
  });

  //ON NEW CHAT MESSAGE
  socket.on("chat-message", (message) => {
    let user = users.find((user) => user.id === socket.id);
    if (user) {
      io.emit("chat-message", formatMessage(user.name, message));
    }
  });

  //ON USER-DISCONNECT
  socket.on("disconnect", () => {
    let user = users.find((user) => user.id === socket.id);
    if (user) {
      socket.broadcast.emit(
        "chat-message",
        formatMessage(BOT, `${user.name} left`)
      );
      users = users.filter((user) => user.id != socket.id);
    }
    io.emit("connected-users", users);
  });
});

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
