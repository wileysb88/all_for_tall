var mongoose = require('mongoose');

var userSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
  shoeSize: Number,
  waistSize: Number,
  inseamLength: Number,
  shirtSize: String
});

module.exports = mongoose.model("User", userSchema)
