const express = require("express");
const router = express.Router();
const {
  createGym,
  getAllGyms,
  getGymById,
  updateGym,
  deleteGym,
  updateCurrentUsers,
} = require("../Controllers/Gym/gym");
const { uploadImages } = require("../middleware/upload");

router.post("/create", uploadImages, createGym);
router.patch("/update", uploadImages, updateGym);

router.get("/all", getAllGyms);
router.get("/single", getGymById);
router.delete("/delete", deleteGym);
router.patch("/update-users", updateCurrentUsers);

module.exports = router;
