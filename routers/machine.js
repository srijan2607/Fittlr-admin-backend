const express = require("express");
const router = express.Router();

const {
    createMachine,
    getAllMachines,
    getMachineById,
    updateMachine,
    deleteMachine,
    updateMachineStatus,
    updateServiceNeeds,
    incrementMachineUses,
  } = require("../Controllers/Machine/machine")

router.post("/create", createMachine);
router.get("/all", getAllMachines);
router.get("/:id", getMachineById);
router.put("/:id", updateMachine);
router.delete("/:id", deleteMachine);
router.put("/status/:id", updateMachineStatus);
router.put("/service/:id", updateServiceNeeds);
router.put("/increment/:id", incrementMachineUses);

module.exports = router;