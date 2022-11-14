const User = require("../models/User");

const isAuthenticated = async (req, res, next) => {
  try {
    const token = req.headers.authorization.replace("Bearer ", "");
    const userFound = await User.findOne({ token: token }).select("account");
    if (userFound) {
      req.user = userFound;
      return next();
    } else {
      return res.status(401).json("Unauthorized");
    }
  } catch (error) {
    return res.status(400).json({ message: error.messsage });
  }
};

module.exports = isAuthenticated;
