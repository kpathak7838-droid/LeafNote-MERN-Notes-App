const express = require("express");
const { noteModel } = require("../model/note.model");

const noteRouter = express.Router();

// 1. /note/create
noteRouter.post("/create", async (req, res) => {
  try {
    const note = new noteModel(req.body);
    await note.save();
    res.send({ msg: "Note created successfully", note });
  } catch (error) {
    res.status(500).send({ msg: "Failed to create note", error: error.message });
  }
});

// 2. /note/read
noteRouter.get("/read", async (req, res) => {
  try {
    const notes = await noteModel
      .find({ userID: req.body.userID })
      .sort({ createdAt: -1 });
    res.send(notes);
  } catch (error) {
    res.status(500).send({ msg: "Failed to fetch notes", error: error.message });
  }
});

// 3. /note/read/:id
noteRouter.get("/read/:id", async (req, res) => {
  try {
    const note = await noteModel.findOne({
      _id: req.params.id,
      userID: req.body.userID,
    });
    if (!note) return res.status(404).send({ msg: "Note not found" });
    res.send(note);
  } catch (error) {
    res.status(500).send({ msg: "Error fetching note", error: error.message });
  }
});

// 4. /note/update/:id
noteRouter.patch("/update/:id", async (req, res) => {
  try {
    await noteModel.findOneAndUpdate(
      { _id: req.params.id, userID: req.body.userID },
      req.body
    );
    res.send({ msg: "Note updated successfully" });
  } catch (error) {
    res.status(500).send({ msg: "Error updating note", error: error.message });
  }
});

// 5. /note/delete/:id
noteRouter.delete("/delete/:id", async (req, res) => {
  try {
    await noteModel.findOneAndDelete({
      _id: req.params.id,
      userID: req.body.userID,
    });
    res.send({ msg: "Note deleted successfully" });
  } catch (error) {
    res.status(500).send({ msg: "Error deleting note", error: error.message });
  }
});

// Fetch all notes from all users (Read-Only for others)
noteRouter.get("/all", async (req, res) => {
  try {
    const notes = await noteModel.find().sort({ createdAt: -1 });
    res.send(notes);
  } catch (error) {
    res.status(500).send({ msg: "Failed to fetch notes", error: error.message });
  }
});

module.exports = { noteRouter };