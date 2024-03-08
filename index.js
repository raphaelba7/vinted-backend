require("dotenv").config();
const express = require("express");
const app = express();
const cloudinary = require("cloudinary").v2;
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const mongoose = require("mongoose");
// middlewares -> ici global car mis directement via la commande app.use
app.use(express.json());

//connexion BDD
mongoose.connect(process.env.MONGODB_URI);

// Import des routes pour les deux collections.
const userRoutes = require("./routes/user");
app.use(userRoutes);

const offerRoutes = require("./routes/offer");
app.use(offerRoutes);

app.all("*", (req, res) => {
  res.status(500).json({
    message: "This route does not exist",
  });
});

app.listen(process.env.PORT, () => console.log("Server started 🔥"));
