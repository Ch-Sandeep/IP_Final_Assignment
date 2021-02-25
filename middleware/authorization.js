require("dotenv").config();

const jwt = require("jsonwebtoken");

function authenticateToken(req, res, next) {
  const authheader = req.headers["authorization"];
  const token = authheader && authheader.split(" ")[1];
  if (token == null) {
    return res.sendStatus(401);
  }

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) {
      console.log(err);
      return res.sendStatus(403);
    }
    req.user = user;
    next();
  });
}

module.exports = { authenticateToken };
