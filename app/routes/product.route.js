const express = require("express");
const products = require("../controllers/product.controller");

const router = express.Router();

router.route("/")
    .get(products.findAll)
    .post(products.create);


router.route("/update-price-purchase/:id") 
    .put(products.updatePricePurchase);

router.route("/update-price-sale/:id") 
    .put(products.updatePriceSale);

router.route("/update-checked") 
    .put(products.updateChecked);

router.route("/:id") 
    .get(products.findOne)
    .put(products.update)
    .delete(products.delete);

module.exports = router;