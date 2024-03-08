const express = require("express");
const router = express.Router();

const SHA256 = require("crypto-js/sha256"); // Sert à hasher
const encBase64 = require("crypto-js/enc-base64"); // Sert à transformer l'encryptage en string
const uid2 = require("uid2"); // Créer des string aléatoires
const isAuthenticated = require("../middlewares/isAuthenticated");

// Import models
const User = require("../models/User");

// ------------ Faire les différentes routes ------------ //
// const signup = { email: req.body.email, username: req.body.username, password: password};

// ------------enregistrement en BDD d'un new user ------------ //

router.post("/user/signup", async (req, res) => {
  const password = req.body.password;

  // salt permettant d'avoir une chaine de caractère aléatoire supplémentaire pour rendre le hashing plus complexe
  const salt = uid2(16);

  // Hashing avec le mot de passe + le salt afin de ne pas stocker directement le mot de passe.
  const hash = SHA256(password + salt).toString(encBase64); // le SHA donne un tableau avec des valeurs num => utilisation de toString pour le mettre en forme.

  // le token qui est stocker en cas de requête valide.
  const token = uid2(32);

  // checker les email en bdd pour pas de doublon
  const checkEmail = await User.findOne({ email: req.body.email });
  //console.log(checkEmail);

  //destructuring de l'objet requête : const { username, email, password, newsletter } = req.body

  try {
    if (!req.body.username || checkEmail) {
      return res.status(400).json({ message: "Bad request !" });
    }
    const newUser = new User({
      email: req.body.email,
      account: {
        username: req.body.username,
        avatar: req.body.avatar,
      },
      salt: salt,
      hash: hash,
      token: token,
      newsletter: req.body.newsletter,
    });
    await newUser.save();
    res.status(201).json({
      _id: `${newUser.id}`,
      token: `${newUser.token}`,
      account: { username: `${newUser.account.username}` },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ------------login d'un user ------------ //
router.post("/user/login", isAuthenticated, async (req, res) => {
  const checkUser = await User.findOne({ email: req.body.email });
  const password = req.body.password;
  const hash = SHA256(password + checkUser.salt).toString(encBase64);
  if (hash !== checkUser.hash) {
    return res.status(500).json({ message: "Mauvais Mot de passe !" });
  }
  try {
    res.status(200).json({
      _id: `${checkUser._id}`,
      token: `${checkUser.token}`,
      account: { username: `${checkUser.account.username}` },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

//export des routes
module.exports = router;
