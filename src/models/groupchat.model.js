import mongoose from "mongoose";

const groupChatSchema = new mongoose.Schema({
  name: { type: String, required: true },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  messages: [
    {
      sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      message: String,
      timestamp: { type: Date, default: Date.now },
    },
  ],
});

const GroupMessage = mongoose.model("GroupChat", groupChatSchema);

export default GroupMessage;