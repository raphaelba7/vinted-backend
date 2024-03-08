const mongoose = require("mongoose");

// Le modèle des publications

const Offer = mongoose.model("Offer", {
  product_name: { type: String, required: true, minLength: 1, maxLength: 50 },
  product_description: {
    type: String,
    required: true,
    minLength: 1,
    maxLength: 500,
  },
  product_price: { type: Number, required: true, min: 1, max: 100000 },
  product_details: Array,
  product_image: Object,
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
});

module.exports = Offer;
