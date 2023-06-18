var express = require("express");
const {
  createUserValidation,
  loginValidation,
  updateUserValidation,
  updatePasswordValidation,
  insertHistoryVAValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
} = require("../../middleware/input-validation");
const { authenticateJWT } = require("../../middleware/authentication");
const { upload } = require("../../middleware/file");
var router = express.Router();
router.get("/", (req, res) => {
  return res.send({
    project: "API v1 UNITOMO VA Payment",
  });
});
var userApi = require("../../api/controller/UserController");
var vaHistoryApi = require("../../api/controller/VAHistoryController");
var mProdiApi = require("../../api/controller/MProdiController");
// User
router.get("/user", userApi.get);
router.get("/user/:nim", userApi.getByNIM);
router.get("/user/verification/:otp", authenticateJWT, userApi.otpVerification);
router.get("/user/resend-verification", authenticateJWT, userApi.resendVerification);
router.post("/user/forgot-password", forgotPasswordValidation, userApi.forgotPassword);
router.post("/user/reset-password", resetPasswordValidation, userApi.resetPassword);
router.post("/user", createUserValidation, userApi.create);
router.post("/user/change-password", authenticateJWT, updatePasswordValidation, userApi.updatePassword);
router.put("/user/:id", authenticateJWT, updateUserValidation, userApi.update);
router.delete("/user/:id", userApi.delete);
router.post("/user/login", loginValidation, userApi.login);
router.put(
  "/user/foto-profil/:id",
  authenticateJWT,
  upload("uploads").single("file"),
  userApi.updateFotoProfil
);

// VA Payment History User
router.get("/va", authenticateJWT, vaHistoryApi.getVAHistory);
router.post("/va", authenticateJWT, insertHistoryVAValidation, vaHistoryApi.insertVA);
router.get("/va/:id", authenticateJWT, vaHistoryApi.updateStatusVA);

// get master prodi
router.get("/prodi", mProdiApi.getMasterProdi);

module.exports = router;
