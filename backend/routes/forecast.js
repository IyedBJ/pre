const express = require("express");
const router = express.Router();
const { getForecast, getGlobalForecast } = require("../controllers/forecastController");

router.get("/global", getGlobalForecast);
router.get("/:projectId", getForecast);

module.exports = router;
