const express = require("express");
const router = express.Router();
const fileUpload = require("express-fileupload");
const converterB64 = require("../utils/base64-converter");
const isAuthenticated = require("../middlewares/isAuthenticated");
const cloudinary = require("cloudinary").v2;

const Offer = require("../models/Offer");

router.post(
  "/offer/publish",
  isAuthenticated,
  fileUpload(),
  async (req, res) => {
    try {
      const { title, description, price, condition, city, brand, size, color } =
        req.body;
      const newOffer = new Offer({
        product_name: title,
        product_description: description,
        product_price: price,
        product_details: [
          {
            MARQUE: brand,
          },
          {
            TAILLE: size,
          },
          {
            ÉTAT: condition,
          },
          {
            COULEUR: color,
          },
          {
            EMPLACEMENT: city,
          },
        ],
        owner: req.user,
      });
      if (req.files) {
        const fileB64 = converterB64(req.files.picture);
        const result = await cloudinary.uploader.upload(fileB64, {
          folder: `/prepa/offer/${newOffer._id}`,
        });
        newOffer.product_image = result;
      }

      await newOffer.save();
      res.status(201).json(newOffer);
    } catch (error) {
      console.log(error.message);
    }
  }
);

router.get("/offers", async (req, res) => {
  try {
    const filters = {};
    if (req.query.title) {
      filters.product_name = new RegExp(req.query.title, "i");
    }

    if (req.query.priceMin) {
      filters.product_price = { $gte: req.query.priceMin };
    }
    if (req.query.priceMax) {
      if (filters.product_price) {
        filters.product_price.$lte = req.query.priceMax;
      } else {
        filters.product_price = { $lte: req.query.priceMax };
      }
    }

    const sortObject = {};
    if (req.query.sort) {
      if (req.query.sort === "price-desc") {
        sortObject.product_price = "desc";
      } else {
        sortObject.product_price = "asc";
      }
    }

    let limit = 4;

    let skip = 0;
    if (req.query.page) {
      skip = (req.query.page - 1) * limit;
    }

    const offers = await Offer.find(filters)
      .select("product_name product_price -_id")
      .sort(sortObject)
      .limit(limit)
      .skip(skip);

    const count = await Offer.find(filters).countDocuments();

    res.status(200).json({ count: count, offers: offers });
  } catch (error) {
    console.log(error.message);
  }
});

module.exports = router;
