const express = require("express");
const router = express.Router();

const login = require("../Controllers/auth/login");
const logout = require("../Controllers/auth/logout");

router.post("/login", login);
router.post("/logout", logout);

module.exports = router;