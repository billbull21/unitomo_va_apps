const { validationResult } = require("express-validator");
const jwt = require("jsonwebtoken");
var User = require("../model/User");
const knex = require("../../db/knex");
const bcrypt = require("bcrypt");
const moment = require("moment");
const {
  sendEmailOnCreateUser,
  sendEmailOnCreateUserWithTemplate,
} = require("../services/email.service");

exports.get = async function (req, res) {
  try {
    let users = await User.query();
    if (users.length > 0) {
      res.status(200).json({
        success: true,
        data: users,
      });
    } else {
      res.status(400).json({
        success: false,
        message: "Data tidak detmukan!",
      });
    }
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
exports.getById = async function (req, res) {
  try {
    let users = await User.query().where("id", "=", req.params.id);
    if (users.length > 0) {
      res.status(200).json({
        success: true,
        data: users,
      });
    } else {
      res.status(400).json({
        success: false,
        message: "Data tidak detmukan!",
      });
    }
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
exports.create = async function (req, res) {
  /* #swagger.tags = ['User']
     #swagger.description = 'Endpoint to createUser' 
  */
  /* #swagger.parameters['body'] = {
      name: 'user',
      in: 'body',
      description: 'User information.',
      required: true,
      schema: { $ref: '#/definitions/UserRequestFormat' }
  } */
  /* #swagger.security = [{
    "apiKeyAuth": []
  }] */

  try {
    const errors = validationResult(req);
    console.log("ERROR", errors);
    if (!errors.isEmpty())
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    const data = req.body;
    bcrypt.hash(data.password, 10).then(async (hashedPassword) => {
      await User.query()
        .insert({
          nama: data.nama,
          username: data.username,
          telp: data.telp,
          email: data.email,
          alamat: data.alamat,
          gender: data.gender,
          password: hashedPassword,
        })
        .returning([
          "id",
          "username",
          "nama",
          "email",
          "telp",
          "alamat",
          "gender",
        ])
        .then(async (users) => {
          const kirim_email = await sendEmailOnCreateUserWithTemplate(users);
          res.status(200).json({
            success: true,
            message: "Anda Berhasil Terdaftar di Sistem Praktikum! ",
            data: {
              username: users.username,
              nama: users.nama,
              email: users.email,
              telp: users.telp,
              alamat: users.alamat,
              gender: users.gender,
            },
          });
        })
        .catch((error) => {
          console.log("ERR:", error);
          res.json({
            success: false,
            message: `Registrasi Gagal, ${error.nativeError.detail} `,
          });
        });
    });
  } catch (error) {
    console.log(error);
    res.json({
      success: false,
      message: "Registrasi Gagal, Internal server error !",
    });
  }
};

exports.update = async function (req, res) {
  /* #swagger.tags = ['User']
    #swagger.description = 'Endpoint untuk mengUpdate Data User' */
  /* #swagger.parameters['body'] = {
    name: 'user',
    in: 'body',
    description: 'User information.',
    required: true,
    schema: { $ref: '#/definitions/UserRequestFormat' }
  } */
  /* #swagger.security = [{
    "apiKeyAuth": []
  }] */

  const data = req.body;
  const { id } = req.params;
  // Check Form Validation
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  try {
    const cek_user = await User.query()
      .where((builder) => {
        builder.where("username", data.username).orWhere("email", data.email);
      })
      .where("id", "<>", id)
      .then((onCheck) => {
        console.log("Check, is Exist in other row :", onCheck);
        return onCheck;
      })
      .catch((err) => {
        console.log("err", err);
        return err;
      });
    console.log("CEK USER:", cek_user);
    // Cek Jika data ada, maka beri return Data Email dna Username sudah terdaftar;
    if (cek_user.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Username atau Email Sudah Terdaftar !",
      });
    } else {
      const dataUpdate = await User.query()
        .patch({
          nama: data.nama,
          username: data.username,
          email: data.email,
          telp: data.telp,
          updated_at: moment(new Date()).format("YYYY-MM-DD HH:mm:ss"),
        })
        .where("id", id)
        .returning("nama", "username", "email")
        .first()
        .then((resp) => {
          console.log("RESP:", resp);
          res.status(200).json({
            success: true,
            message: "Data user berhasil di Update",
            data: resp,
          });
        })
        .catch((err) => {
          res.status(500).json({
            success: false,
            message: "Data user gagal di Update !",
          });
        });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false,
      message: "Data user gagal di Update !",
    });
  }
};

exports.delete = async function (req, res) {
  try {
    let users = await User.query().deleteById(req.params.id);
    console.log("USERS DELETE", users);
    if (users == 1) {
      res.status(200).json({
        success: true,
        message: "Data berhasil dihapus!",
      });
    } else {
      res.status(400).json({
        success: false,
        message: "Data tidak detmukan!",
      });
    }
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

exports.login = async function (req, res, next) {
  /* #swagger.tags = ['User']
     #swagger.description = 'Endpoint to Login' 
  */
  /* #swagger.parameters['body'] = {
      name: 'login',
      in: 'body',
      description: 'Data Login.',
      required: true,
      schema: { $ref: '#/definitions/LoginRequestFormat' }
  } */
  /* #swagger.security = [{
    "apiKeyAuth": []
  }] */

  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  try {
    const data = req.body;
    const identity = data.identity;
    const password = data.password;
    const cek_user = await User.query().where((builder) => {
      builder.where("username", identity).orWhere("email", identity);
    });
    // Akan menghasilkan query yg sama seperti select * from users where (username = 'identity'  or email = 'identity'
    console.log("USER:", cek_user.length);
    if (cek_user.length > 0) {
      const data_user = cek_user[0];
      bcrypt
        .compare(password, data_user.password)
        .then(async (isAuthenticated) => {
          if (!isAuthenticated) {
            res.json({
              success: false,
              message: "Password yang Anda masukkan, salah !",
            });
          } else {
            const data_jwt = {
              username: data_user.username,
              email: data_user.email,
            };
            const jwt_token = jwt.sign(data_jwt, process.env.API_SECRET, {
              expiresIn: "10m",
            });
            res.status(200).json({
              success: true,
              data: data_jwt,
              jwt_token,
            });
          }
        });
    } else {
      res.status(400).json({
        success: false,
        message: "Username atau Email tidak terdaftar !",
      });
    }
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

exports.updateFotoProfil = async function (req, res) {
  /* #swagger.tags = ['User']
    #swagger.description = 'Endpoint untuk mengUpdate Foto Profil User' */
  /* #swagger.consumes = ['multipart/form-data']
    #swagger.parameters['file'] = {
    type: 'file',
    in: 'formData',
    description: 'Foto profil user.',
    required: true
    } */
  try {
    const file = req.file;
    const { id } = req.params;
    const dataUpdate = await User.query()
      .patch({
        foto: "uploads/" + file.filename,
        updated_at: moment(new Date()).format("YYYY-MM-DD HH:mm:ss"),
      })
      .where("id", id)
      .returning("id", "nama", "foto")
      .first()
      .then((resp) => {
        res.status(200).json({
          success: true,
          message: "Data user berhasil di Update",
          data: resp,
        });
      })
      .catch((err) => {
        res.status(500).json({
          success: false,
          message: "Data user gagal di Update !",
        });
      });
  } catch (err) {
    console.log(err);
    res
      .status(500)
      .json({ success: false, message: "Data user gagal di Update !" });
  }
};
