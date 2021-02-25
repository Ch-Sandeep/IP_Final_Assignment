const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: true,
      validate(name) {
        if (validator.isNumeric(name)) {
          throw new Error("Name cannot contain numbers!!");
        }
      },
    },
    age: {
      type: Number,
      default: 0,
      validate(age) {
        if (age < 0) {
          throw new Error("Age cannot be less than zero!!");
        }
      },
    },
    email: {
      required: true,
      trim: true,
      unique: true,
      lowercase: true,
      type: String,
      validate(email) {
        if (!validator.isEmail(email)) {
          throw new Error("Invalid email Id!!");
        }
      },
    },
    username: {
      type: String,
      trim: true,
      required: true,
      validate(username) {
        if (validator.isNumeric(username)) {
          throw new Error("username cannot contain numbers!!");
        }
      },
    },
    password: {
      required: true,
      trim: true,
      minlength: 7,
      type: String,
      validate(pwd) {
        if (pwd.toLowerCase().includes("password")) {
          throw new Error("Password cannot contain 'password'!!");
        }
      },
    },
    token: String,
  },
  { timestamps: true }
);

userSchema.virtual("tasks", {
  ref: "Task",
  localField: "_id",
  foreignField: "owner",
});

const user = mongoose.model("users_records", userSchema);

module.exports = user;
