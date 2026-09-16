const express = require("express");
const multer = require("multer");
const { testGemini,analyzeAudio } = require("../services/analysis");

const router = express.Router();
const upload = multer({
  limits: {
    fileSize: 25 * 1024 * 1024,
  },
});
router.get("/test", async (req, res) => {
  try {
    const result = await testGemini();

    res.json({
      success: true,
      message: result,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Gemini test failed",
      error: error.message,
    });
  }
});
router.post("/", upload.single("audio"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No audio file was uploaded.",
      });
    }

   /* res.json({
      success: true,
      message: "Audio received successfully.",
      fileName: req.file.originalname,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
    });*/
    const result = await analyzeAudio(
  req.file.buffer,
  req.file.mimetype,
  req.file.originalname
);

res.json({
  success: true,
  message: "Audio analyzed successfully.",
  fileName: req.file.originalname,
  analysis: result,
});
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Audio upload failed.",
      error: error.message,
    });
  }
});
module.exports = router;