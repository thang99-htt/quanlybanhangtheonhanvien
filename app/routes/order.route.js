const express = require("express");
const orders = require("../controllers/order.controller");

const router = express.Router();

router.route("/")
    .get(orders.findAll)
    .post(orders.create);

router.route("/:id") 
    .get(orders.findOne)
    .put(orders.update);

module.exports = router;