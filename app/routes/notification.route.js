const express = require("express");
const notifications = require("../controllers/notification.controller");

const router = express.Router();

router.route("/")
    .get(notifications.findAll)
    .post(notifications.create);

router.route("/:id") 
    .get(notifications.findOne);

router.route("/readed/:id") 
    .put(notifications.updateReaded);

module.exports = router;