require("dotenv").config();
const express = require("express");

const mongoose = require("mongoose");

const user = require("./models/userschema");

const auth = require("./middleware/authorization");

const bcrypt = require("bcryptjs");

const app = express();

const jwt = require("jsonwebtoken");

const Task = require("./models/tasks");

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Welcome to my page...");
});

//const user=new mongoose.model("users_records",userSchema)

mongoose
  .connect("mongodb://localhost:27017/usersdb", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
  })
  .then(() => {
    console.log("Mydb connected successfully...");
  })
  .catch(() => {
    console.log("Error occured...");
  });

app.post("/signup", async (req, res) => {
  const hashedpass = await bcrypt.hash(req.body.password, 10);
  const newuser = {
    name: req.body.name,
    age: req.body.age,
    email: req.body.email,
    username: req.body.username,
    password: hashedpass,
  };
  user.find({}, (err, data) => {
    if (data.length === 0) {
      const userdata = new user(newuser);

      userdata.save();
      res.end("user data added successfully...");
    } else {
      user.find({ name: newuser.name }, (err, val) => {
        if (err) {
          res.end(err);
        }
        if (val.length != 0) {
          res.end("user already exists. Please login...");
        } else {
          const userdata = new user(newuser);

          userdata.save();
          res.end("user data added successfully...");
        }
      });
    }
  });
});

app.post("/login", async (req, res) => {
  const myuser = await user.findOne({ username: req.body.username });
  //console.log(myuser)
  if (myuser == null) {
    return res.send("No user exists.Please signup...");
  }
  try {
    if (await bcrypt.compare(req.body.password, myuser.password)) {
      const puser = {
        username: req.body.username,
        password: req.body.password,
      };
      const accesstoken = jwt.sign(puser, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "50m",
      });
      await user.updateOne(
        { username: req.body.username },
        { $set: { token: accesstoken } }
      );
      res.json({ accesstoken: accesstoken });
    } else {
      res.send("Wrong password...");
    }
  } catch {
    res.status(500).send();
  }
});

app.get("/listusers", auth.authenticateToken, async (req, res) => {
  let lusers = [];
  for await (const doc of user.find({})) {
    const nuser = {
      name: doc.name,
      age: doc.age,
      email: doc.email,
      username: doc.username,
    };
    lusers.push(nuser);
  }
  res.send(lusers);
});

app.patch("/updateuser", auth.authenticateToken, async (req, res) => {
  const authheader = req.headers["authorization"];
  var token = authheader && authheader.split(" ")[1],
    decoded;

  try {
    decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
  } catch (e) {
    res.end(e);
  }
  try {
    await user.findOneAndUpdate({ username: decoded.username }, req.body);
    res.send("user updated successfully...");
  } catch (err) {
    res.send(err);
  }
});

app.post("/deleteuser", auth.authenticateToken, async (req, res) => {
  const authheader = req.headers["authorization"];
  var token = authheader && authheader.split(" ")[1],
    decoded;

  try {
    decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
  } catch (e) {
    res.end(e);
  }

  const u = await user.findOne({ username: decoded.username });

  try {
    await user.deleteOne({ username: decoded.username });
    await Task.deleteMany({ owner: u._id });
    res.send("User and tasks related to him are deleted successfully...");
  } catch (err) {
    res.send(err);
  }
});

app.post("/logout", async (req, res) => {
  const pruser = await user.findOne({ username: req.body.username });
  try {
    if (await bcrypt.compare(req.body.password, pruser.password)) {
      if (pruser.token != undefined) {
        await user.updateOne(
          { username: pruser.username },
          { $set: { token: undefined } }
        );
        res.end("user logged out successfully...");
      } else {
        res.end("User is already loggedout...");
      }
    } else {
      res.end("Wrong password...");
    }
  } catch {
    res.Status(500).send();
  }
});

//...........CRUD OPERATIONS ON TASK................

app.post("/createtask", auth.authenticateToken, async (req, res) => {
  //console.log(req.body);
  const authheader = req.headers["authorization"];
  var token = authheader && authheader.split(" ")[1],
    decoded;

  try {
    decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
  } catch (e) {
    res.end(e);
  }
  const u = await user.findOne({ username: decoded.username });
  //console.log(u._id);
  try {
    const newtask = {
      description: req.body.des,
      completed: req.body.stat,
      owner: u._id,
    };
    const ctask = await Task.findOne({
      owner: u._id,
      description: newtask.description,
    });
    //console.log(ctask);
    if (ctask != null) {
      res.end("Task already exists.Please update if you want...");
    } else {
      const taskdata = new Task(newtask);

      await taskdata.save();

      res.send("Task added successfully...");
    }
  } catch (err) {
    //console.log(err);
    res.sendStatus(500);
  }
});

app.post("/listtasks", auth.authenticateToken, async (req, res) => {
  let ltasks = [];
  const authheader = req.headers["authorization"];
  var token = authheader && authheader.split(" ")[1],
    decoded;

  try {
    decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
  } catch (e) {
    res.end(e);
  }
  const u = await user.findOne({ username: decoded.username });
  for await (const doc of Task.find({ owner: u._id })) {
    const d = {
      description: doc.description,
      status: doc.completed,
    };
    ltasks.push(d); // Prints documents one at a time
  }
  res.send(ltasks);
});

app.post("/updatetask", auth.authenticateToken, async (req, res) => {
  const authheader = req.headers["authorization"];
  var token = authheader && authheader.split(" ")[1],
    decoded;

  try {
    decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
  } catch (e) {
    res.end(e);
  }
  const u = await user.findOne({ username: decoded.username });
  try {
    await Task.updateOne(
      { owner: u._id, description: req.body.description },
      { $set: { completed: req.body.status } }
    );
    res.send("Task updated successfully...");
  } catch (err) {
    res.send(err);
  }
});

app.post("/deletetask", auth.authenticateToken, async (req, res) => {
  const authheader = req.headers["authorization"];
  var token = authheader && authheader.split(" ")[1],
    decoded;

  try {
    decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
  } catch (e) {
    res.end(e);
  }
  const u = await user.findOne({ username: decoded.username });
  try {
    await Task.deleteOne({ owner: u._id, description: req.body.description });
    res.send("Task deleted successfully...");
  } catch (err) {
    res.send(err);
  }
});

const port = process.env.PORT;

app.listen(port, function () {
  console.log("Server running on port " + port);
});
