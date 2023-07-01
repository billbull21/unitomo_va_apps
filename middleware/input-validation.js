const { check } = require("express-validator");

exports.createUserValidation = [
  check("nama", "Nama tidak boleh kosong").not().isEmpty(),
  check("nim", "NIM tidak boleh kosong").not().isEmpty(),
  check("email", "Email harus valid!").isEmail(),
  check("prodi", "Prodi tidak boleh kosong").not().isEmpty(),
  check("password", "Password minimal 6 karakter").isLength({ min: 6 }),
];

exports.loginValidation = [
  check("nim", "NIM tidak boleh kosong").not().isEmpty(),
  check("password", "Password tidak boleh kosong").not().isEmpty(),
];


exports.updateUserValidation = [
  check("nama", "Nama tidak boleh kosong").not().isEmpty(),
  check("nim", "NIM tidak boleh kosong").not().isEmpty(),
  check("email", "Email harus valid!").isEmail(),
  check("prodi", "Prodi tidak boleh kosong").not().isEmpty(),
];

exports.updatePasswordValidation = [
  check("password", "Password tidak boleh kosong").not().isEmpty(),
  check("new_password", "Password Baru minimal 6 karakter").isLength({ min: 6 }),
];

exports.forgotPasswordValidation = [
  check("email", "Email harus valid!").isEmail(),
];

exports.resetPasswordValidation = [
  check("email", "Email harus valid!").isEmail(),
  check("otp", "OTP wajib diisi!").not().isEmpty(),
  check("password", "Password Baru minimal 6 karakter").isLength({ min: 6 }),
];

exports.insertHistoryVAValidation = [
  check("user_id", "ID User tidak boleh kosong").not().isEmpty(),
  check("va", "VA tidak boleh kosong").not().isEmpty(),
  check("payment_category", "Kategori Pembayaran tidak boleh kosong").not().isEmpty(),
  check("nominal", "Nominal Pembayaran tidak boleh kosong").not().isEmpty(),
];