const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    description: { type: String, required: true, trim: true },
    completed: { type: String },
    owner: {
      type: String,
      required: true,
      ref: "users_records",
    },
  },
  { timestamps: true }
);

const Task = mongoose.model("Task", taskSchema);

module.exports = Task;
