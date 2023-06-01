var express = require("express");
const {
  createUserValidation,
  loginValidation,
  updateUserValidation,
} = require("../../middleware/input-validation");
const { authenticateJWT } = require("../../middleware/authentication");
const { upload } = require("../../middleware/file");
var router = express.Router();
router.get("/", (req, res) => {
  return res.send({
    project: "API v1 Web Service Praktikum Back-ENd",
  });
});
var userApi = require("../../api/controller/UserController");
// User
router.get("/user", userApi.get);
router.get("/user/:id", userApi.getById);
router.post("/user", createUserValidation, userApi.create);
router.put("/user/:id", authenticateJWT, updateUserValidation, userApi.update);
router.delete("/user/:id", userApi.delete);
router.post("/user/login", loginValidation, userApi.login);
router.put(
  "/user/foto-profil/:id",
  authenticateJWT,
  upload("uploads").single("file"),
  userApi.updateFotoProfil
);
module.exports = router;
