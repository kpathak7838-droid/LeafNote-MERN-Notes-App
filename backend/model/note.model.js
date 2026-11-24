const mongoose = require("mongoose");

const noteSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    body: { type: String, required: true },
    category: { type: String, required: true },
    userID: { type: String, required: true },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const noteModel = mongoose.model("note", noteSchema);

module.exports = { noteModel };