import express from "express";
import cors from "cors";
import { connectMongoDB } from "./src/db/db.js";
import http from "http";
import { Server } from "socket.io";
import Message from "./src/models/directmessag.model.js";
import GroupMessage from "./src/models/groupchat.model.js";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import fs from "fs";
import CryptoJS from "crypto-js";
import groupRouter from "./src/controller/group.controller.js";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});
app.use(cors());
app.use("/group", groupRouter);

const encryptMessage = (message, secretKey) => {
  const ciphertext = CryptoJS.AES.encrypt(message, secretKey).toString();
  return ciphertext;
};


// Decryption function
const decryptMessage = (ciphertext, secretKey) => {
  const bytes = CryptoJS.AES.decrypt(ciphertext, secretKey);
  const plaintext = bytes.toString(CryptoJS.enc.Utf8);
  return plaintext;
};


// Set up storage for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const filename = `${Date.now()}-${file.originalname}`;
    cb(null, filename);
  },
});
const upload = multer({ storage: storage });

let messages = {};
io.on("connection", (socket) => {
  console.log("A user connected");

  // Handle direct messages
  socket.on(
    "direct message",
    async ({ senderId, recipientId, message, file }) => {
      // Save the uploaded file to the server
      let fileUrl = "";
      if (file) {
        const filename = `${Date.now()}-${file.originalname}`;
        fileUrl = `${req.protocol}://${req.hostname}:${
          process.env.PORT || 4000
        }/${filename}`;
        file.mv(`uploads/${filename}`);
      }

      // Encrypt the message
      const secretKey = recipientId + senderId; // Use recipientId and senderId as the key
      const encryptedMessage = CryptoJS.AES.encrypt(
        message,
        secretKey
      ).toString();

      // Create a new message object and save it to the database
      const newMessage = new Message({
        id: uuidv4(),
        sender: senderId,
        receiver: recipientId,
        message: encryptedMessage, // Save the encrypted message instead of the original message
        fileUrl: fileUrl,
      });
      await newMessage.save();

      // Decrypt the message and emit the new message to the sender and recipient
      const decryptedMessage = CryptoJS.AES.decrypt(
        encryptedMessage,
        secretKey
      ).toString(CryptoJS.enc.Utf8);
      newMessage.message = decryptedMessage; // Update the message with the decrypted message
      socket.emit("direct message", newMessage);
      io.to(recipientId).emit("direct message", newMessage);
    }
  );

  // Handle group messages
  const groupChat = io.of("/group-chat");
  groupChat.on("connection", (socket) => {
    console.log("A user connected to the group chat");

    // Handle new messages in the group chat
    socket.on(
      "new group message",
      upload.single("file"),
      async ({ senderId, message }) => {
        // Save the uploaded file to the server
        let fileUrl = "";
        if (req.file) {
          const filename = `${Date.now()}-${req.file.originalname}`;
          fileUrl = `${req.protocol}://${req.hostname}:${
            process.env.PORT || 4000
          }/${filename}`;
          req.file.mv(`uploads/${filename}`);
        }

        // Create a new message object and save it to the database
        const newMessage = new GroupMessage({
          sender: senderId,
          message: message,
          fileUrl: fileUrl,
        });
        await newMessage.save();

        // Emit the new message to all clients in the group chat namespace
        groupChat.emit("new group message", newMessage);
      }
    );
  });
});

app.listen(4000, async (req, res) => {
  try {
    await connectMongoDB();
    console.log("listening to the port " + 4000);
  } catch (error) {
    console.log(error);
  }
});

server.listen(5000, () => {
  console.log("listening on port 5000");
});
