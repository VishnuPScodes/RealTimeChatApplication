import express from 'express';
import cors from 'cors';
import { connectMongoDB } from './src/db/db.js';
import http from "http";
import { Server } from "socket.io";
import Message from './src/models/directmessag.model.js';
import GroupMessage from './src/models/groupchat.model.js';
const app=express();
const server = http.createServer(app);
const io = new Server(server,{
    cors:{
      origin:"*"
    }
});
app.use(cors());

let messages={};
io.on("connection", (socket) => {
  console.log("A user connected");

  // Handle direct messages
  socket.on("direct message", async ({ senderId, recipientId, message }) => {
    // Create a new message object and save it to the database
    const newMessage = new Message({
      sender: senderId,
      receiver: recipientId,
      message: message,
    });
    await newMessage.save();

    // Emit the new message to the sender and recipient
    socket.emit("direct message", newMessage);
    io.to(recipientId).emit("direct message", newMessage);
  });

  // Handle group messages
  const groupChat = io.of("/group-chat");
  groupChat.on("connection", (socket) => {
    console.log("A user connected to the group chat");

    // Handle new messages in the group chat
    socket.on("new group message", async ({ senderId, message }) => {
      // Create a new message object and save it to the database
      const newMessage = new GroupMessage({
        sender: senderId,
        message: message,
      });
      await newMessage.save();

      // Emit the new message to all clients in the group chat namespace
      groupChat.emit("new group message", newMessage);
    });
  });
});


app.listen(4000, async (req, res) => {
  try {
    await connectMongoDB();
    console.log("listening to the port " + 400);
  } catch (error) {
    console.log(error);
  }
});

server.listen(5000,()=>{
    console.log('listening on port 5000')
})