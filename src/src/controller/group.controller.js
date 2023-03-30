import express from 'express';
import { authenticate } from '../middlewares/authentication.js';

const router=express.Router();

// Add a new user to a group
router.post("/addUserToGroup",authenticate, async (req, res) => {
  const groupId = req.body.groupId;
  const userId = req.body.userId;
  try {
    // Find the group by ID and add the user to the members array
    const group = await GroupChat.findByIdAndUpdate(
      groupId,
      { $push: { members: userId } },
      { new: true }
    ).populate("members");
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }
    res.status(200).json({ message: "User added to group", group });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Create a new group
router.post("/createGroup",authenticate, async (req, res) => {
  const groupName = req.body.groupName;
  const userId = req.body.userId;
  try {
    // Create a new group and add the creator to the members array
    const group = new GroupChat({
      name: groupName,
      members: [userId],
    });
    const savedGroup = await group.save();
    res.status(201).json({ message: "Group created", group: savedGroup });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;