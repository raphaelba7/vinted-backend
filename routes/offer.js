const express = require("express");
const fileUpload = require("express-fileupload");
const router = express.Router();

const Offer = require("../models/Offer");
const User = require("../models/User");
const isAuthenticated = require("../middlewares/isAuthenticated");

const convertToBase64 = (file) => {
  return `data:${file.mimetype};base64,${file.data.toString("base64")}`;
};

// ------------ Faire les différentes routes ------------ //

// ------------enregistrement en BDD d'une offre -> link to a user ------------ //

router.post(
  "/offer/publish",
  isAuthenticated,
  fileUpload(),
  async (req, res) => {
    try {
      const tokenUser = req.headers.authorization.replace("Bearer ", "");
      const userRef = await User.findOne({ token: tokenUser }).select(
        "account"
      );
      //console.log(userRef);
      if (!userRef) {
        res.status(401).json({ message: "Unauthorized" });
      } else {
        if (
          req.body.title > 50 ||
          req.body.description > 500 ||
          req.body.price > 100000
        ) {
          return res.status(400).json({
            message:
              "vérifier que le titre ne dépasse pas 50 characteres, description 500 et prix 100000",
          });
        } else {
          const newOffer = new Offer({
            product_name: req.body.title,
            product_description: req.body.description,
            product_price: req.body.price,
            product_details: [
              { MARQUE: req.body.brand },
              { TAILLE: req.body.size },
              { ETAT: req.body.condition },
              { COULEUR: req.body.color },
              { EMPLACEMENT: req.body.city },
            ],
            product_image: {},
            owner: userRef,
          });
          const convertedFile = convertToBase64(req.files.picture);
          newOffer.product_image = await cloudinary.uploader.upload(
            convertedFile,
            {
              folder: `vinted/offers/${newOffer.id}`,
            }
          );
          await newOffer.save();
          res.status(201).json({
            _id: newOffer._id,
            product_name: newOffer.product_name,
            product_description: newOffer.product_description,
            product_price: newOffer.product_price,
            product_details: newOffer.product_details,
            owner: {
              account: { username: userRef.account.username },
              _id: userRef._id,
            },
            product_image: {
              secure_url: newOffer.product_image.secure_url,
              folder: newOffer.product_image.folder,
            },
          });
        }
      }
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);
// ------------ Modifier une offre ------------ //
router.put("/offer/:id", isAuthenticated, fileUpload(), async (req, res) => {
  try {
    const tokenUser = req.headers.authorization.replace("Bearer ", "");
    const userRef = await User.findOne({ token: tokenUser });
    //console.log(userRef);
    if (!userRef) {
      res.status(401).json({ message: "Unauthorized" });
    } else {
      const offerToUpdate = await Offer.findById(req.params.id);
      const {
        title,
        description,
        price,
        brand,
        size,
        condition,
        color,
        city,
        picture,
      } = req.body;

      const newOfferUpdate = {};

      if (title && title !== offerToUpdate.product_name) {
        newOfferUpdate.product_name = title;
      }

      if (description && description !== offerToUpdate.product_description) {
        newOfferUpdate.product_description = description;
      }
      if (price && price !== offerToUpdate.product_details.price) {
        newOfferUpdate.product_price = price;
      }
      if (brand && brand !== offerToUpdate.product_details.brand) {
        newOfferUpdate.product_details = [{ MARQUE: brand }];
      }
      if (newOfferUpdate.product_details["MARQUE"]) {
        if (size && size !== offerToUpdate.product_details.size) {
          newOfferUpdate.product_details = [{ TAILLE: size }];
        }
      } else {
        newOfferUpdate.product_details = [
          ...offerToUpdate.product_details,
          { TAILLE: size },
        ];
      }
      if (
        newOfferUpdate.product_details["TAILLE"] ||
        newOfferUpdate.product_details["MARQUE"]
      ) {
        if (
          condition &&
          condition !== offerToUpdate.product_details.condition
        ) {
          newOfferUpdate.product_details = [{ ETAT: condition }];
        }
      } else {
        newOfferUpdate.product_details = [
          ...offerToUpdate.product_details,
          { ETAT: condition },
        ];
      }

      if (
        newOfferUpdate.product_details["ETAT"] ||
        newOfferUpdate.product_details["TAILLE"] ||
        newOfferUpdate.product_details["MARQUE"]
      ) {
        if (color && color !== offerToUpdate.product_details.color) {
          newOfferUpdate.product_details = [{ COULEUR: color }];
        }
      } else {
        newOfferUpdate.product_details = [
          ...offerToUpdate.product_details,
          { COULEUR: color },
        ];
      }

      if (
        newOfferUpdate.product_details["COULEUR"] ||
        newOfferUpdate.product_details["ETAT"] ||
        newOfferUpdate.product_details["TAILLE"] ||
        newOfferUpdate.product_details["MARQUE"]
      ) {
        if (city && city !== offerToUpdate.product_details.city) {
          newOfferUpdate.product_details = [{ EMPLACEMENT: city }];
        }
      } else {
        newOfferUpdate.product_details = [
          ...offerToUpdate.product_details,
          { EMPLACEMENT: city },
        ];
      }

      console.log(newOfferUpdate);
      // if (picture && picture !== offerToUpdate.product_details.picture) {
      //   const imageD = await Offer.findById(req.params.id);

      //   const imageToDelete = await cloudinary.uploader.destroy(
      //     imageD.product_image.public_id
      //   );

      //   const convertedFile = convertToBase64(req.files.picture);

      //   const uploadResult = await cloudinary.uploader.upload(convertedFile, {
      //     folder: `vinted/offers`,
      //   });
      //   const pathPicture = uploadResult.folder + "/" + offerToUpdate._id;
      //   offerToUpdate.product_image.folder = pathPicture;
      // }
      //await offerToUpdate.save();

      res.status(200).json({ message: "Offer modified successfully" });
    }
  } catch (error) {
    res.status(501).json({ message: error.message });
  }
});

// ------------ Supprimer une offre ------------ //
router.delete("/offer/:id", isAuthenticated, fileUpload(), async (req, res) => {
  try {
    const tokenUser = req.headers.authorization.replace("Bearer ", "");
    const userRef = await User.findOne({ token: tokenUser });
    const offerRef = await Offer.findById(req.params.id);
    // console.log(userRef._id);
    // console.log(offerRef.owner);
    if (!userRef && userRef._id !== offerRef.owner) {
      res.status(401).json({ message: "Unauthorized" });
    } else {
      const imageD = await Offer.findById(req.params.id);
      //console.log(imageD.product_image.public_id);
      const offerToDelete = await Offer.findByIdAndDelete(req.params.id);
      const imageToDelete = await cloudinary.uploader.destroy(
        imageD.product_image.public_id
      );
      res.status(200).json({ message: "Offer deleted successfully" });
    }
  } catch (error) {
    res.status(501).json({ message: error.message });
  }
});

// ------------ Afficher les offres avec des filtres------------ //
router.get("/offers", async (req, res) => {
  try {
    //---- regExp ----//
    //const regExp = /chaussure/i;
    // le i est pour insansitive -> pour les majuscules / min ....
    // const regExp = new RegExp("pantalon", "i");
    // const offers = Offer.find({ product_name: regExp }).select("product_name");

    //---- afficher moins et plus / egal ----//
    //  Pour afficher en plus ou moins et egal à 50€ par exemple.
    // const offers = await Offer.find({
    //   product_price: {
    //     $lte: 50,
    //   },
    // }).select("product_name product_price");
    // $gte   >=
    // $lte   <=
    // $gt    >
    // $lt    >

    //---- Tri croissant et decroissant ----//
    // Trie croissant et decroissant avec méthode .sort()
    // const offers = Offer.find()
    //   .sort({
    //     product_price: "asc", // ou 1  et pour decroi => -1 ou desc
    //   })
    //   .select("product_name product_price");

    //---- limite d'affichage et afficher les offres depuis un point ----//
    // skip les 3 premiers et limit les offres affiche a 5.
    // const offers = Offer.find()
    //   .select("product_name product_price")
    //   .skip(3)
    //   .limite(5);

    // const offers = await Offer.find({
    //   product_name: new RegExp("chaussure", "i"),
    //   product_price: {
    //     $gte: 50,
    //     $lte: 100,
    //   },
    // })
    //   .sort({ product_price: "asc" })
    //   .skip(0)
    //   .limit(2)
    //   .select("product_name product_price");
    const { title, page, priceMin, priceMax, sort } = req.query;
    const skipLimit = 5;

    const offersResearch = {};
    const orderResearch = {};

    if (title) {
      offersResearch.product_name = new RegExp(new RegExp(`${title}`, "i"));
    }
    if (priceMin) {
      offersResearch.product_price = { $gte: Number(priceMin) };
    }
    console.log(offersResearch.product_price);
    if (priceMax) {
      if (offersResearch.product_price.$gte) {
        offersResearch.product_price.$lte = Number(priceMax);
      } else {
        offersResearch.product_price = { $lte: Number(priceMax) };
      }
    }
    console.log(offersResearch.product_price);
    if (sort) {
      const triSort = sort.replace("price-", "");
      orderResearch.product_order = { product_price: triSort };
    }
    const offers = await Offer.find(offersResearch)
      .skip(skipLimit * (Number(page) - 1))
      .limit(5)
      .sort(orderResearch.product_order)
      .populate("owner", "account");
    //.select("product_name product_price");

    const countResult = await Offer.countDocuments(offersResearch);

    res.status(200).json({ count: countResult, offers });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/offers/:id", async (req, res) => {
  try {
    const offerDetails = await Offer.findById(req.params.id).populate("owner");
    res.status(200).json({ offerDetails });
  } catch (error) {
    res.status(501).json({ message: error.message });
  }
});

//export des routes
module.exports = router;
