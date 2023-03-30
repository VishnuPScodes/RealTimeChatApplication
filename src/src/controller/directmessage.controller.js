import express from 'express';
const router=express.Router();



router.get("/messages/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;

    // Retrieve the messages from the database
    const messagesFromDB = await Message.find({
      $or: [{ sender: userId }, { receiver: userId }],
    });

    // Filter the messages in the messages array that match the user ID
    const messagesForUser = messages.filter((message) => {
      return (
        message.sender.toString() === userId ||
        message.receiver.toString() === userId
      );
    });

    // Concatenate the messages from the database and the messages array
    const allMessages = messagesFromDB.concat(messagesForUser);

    // Sort the messages by timestamp
    allMessages.sort((a, b) => a.timestamp - b.timestamp);

    res.json({ success: true, messages: allMessages });
  } catch (err) {
    console.error(err);
    res.json({ success: false, error: err.message });
  }
});

export default router;