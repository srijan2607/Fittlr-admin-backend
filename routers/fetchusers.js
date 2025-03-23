const express = require("express");
const router = express.Router();

const { get_all_users } = require("../Controllers/users/users");

router.get("/all", get_all_users);

module.exports = router;
