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
var mKodePayApi = require("../../api/controller/MKodePayController");
// User
router.get("/user", authenticateJWT, userApi.get);
router.get("/user/data", authenticateJWT, userApi.getUserData); // get user data by it's token
router.get("/user/get-user-by-nim/:nim", authenticateJWT, userApi.getByNIM);
router.get("/user/resend-verification", authenticateJWT, userApi.resendVerification);
router.get("/user/verification/:otp", authenticateJWT, userApi.otpVerification);
router.post("/user/forgot-password", forgotPasswordValidation, userApi.forgotPassword);
router.post("/user/reset-password", resetPasswordValidation, userApi.resetPassword);
router.post("/user", createUserValidation, userApi.create);
router.post("/user/change-password", authenticateJWT, updatePasswordValidation, userApi.updatePassword);
router.put("/user", authenticateJWT, updateUserValidation, userApi.update);
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
router.get("/va/:id", authenticateJWT, vaHistoryApi.getVAHistoryByID);
router.put("/va/:id", authenticateJWT, vaHistoryApi.extendVAExpiredDate);
router.delete("/va/:id", authenticateJWT, vaHistoryApi.delete);

// get master prodi
router.get("/prodi", mProdiApi.getMasterProdi);

// get master kode pay
router.get("/paycode", authenticateJWT, mKodePayApi.getMasterKodePay);

module.exports = router;
