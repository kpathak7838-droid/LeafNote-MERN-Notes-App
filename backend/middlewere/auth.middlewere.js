const jwt = require("jsonwebtoken");

const auth = (req, res, next) => {
  try {
    const token = req.headers.authorization;
    const decoded = jwt.verify(token, "coding");

    if (decoded) {
      req.body = req.body || {};
      req.body.userID = decoded.userID;
      next();
    } else {
      res.send({ msg: "Login First" });
    }
  } catch (error) {
    res.send({ msg: "Login First" });
  }
};

module.exports = { auth };