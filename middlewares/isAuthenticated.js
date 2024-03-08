const User = require("../models/User");

const isAuthenticated = async (req, res, next) => {
  const receivedToken = req.headers.authorization.replace("Bearer ", "");
  const owner = await User.findOne({ token: receivedToken });
  if (owner) {
    next();
  } else {
    return res.status(401).json("Unauthorized");
  }
};

module.exports = isAuthenticated;
