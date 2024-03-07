const express = require("express");
const revenues = require("../controllers/revenue.controller");

const router = express.Router();


router.route("/:id") 
    .get(revenues.findOne);

module.exports = router;