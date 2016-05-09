var mongoose = require('mongoose');

var StoreSchema = new mongoose.Schema({
  storeName: String,
  lat: Number,
  lng: Number,
  address: String,
  shoeSizeOffering: Number,
  waistSizeOffering: Number,
  inseamLengthOffering: Number,
  shirtSizeOffering: String,
  Hours: Number,
  website: String
});

module.exports = mongoose.model("Store", StoreSchema)
