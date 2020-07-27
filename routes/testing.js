const express = require("express");

const {
  getAllExperiments,
  createExperiment,
  createSegment,
  createVariant,
  getExperiment,
} = require("./../controllers/testingController");

const router = express.Router();

router.route("/").get(getAllExperiments);
router.route("/get_exp/:id").get(getExperiment);
router.route("/create_exp").post(createExperiment);
router.route("/create_seg").post(createSegment);
router.route("/create_var").post(createVariant);

module.exports = router;
