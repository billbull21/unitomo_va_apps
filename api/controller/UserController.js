const { validationResult } = require("express-validator");
const jwt = require("jsonwebtoken");
var User = require("../model/User");
const knex = require("../../db/knex");
const bcrypt = require("bcrypt");
const moment = require("moment");
const {
  sendEmailOnCreateUserWithTemplate,
  sendEmailUpdatePasswordWithTemplate,
  sendEmailForgotPasswordWithTemplate,
} = require("../services/email.service");
const MProdi = require("../model/MProdi");

exports.get = async function (req, res) {
  /* #swagger.tags = ['User']
     #swagger.description = 'Endpoint to fetch all users' 
  */
  try {
    let users = await User.query();
    if (users.length > 0) {
      return res.status(200).json({
        success: true,
        data: users,
      });
    } else {
      return res.status(400).json({
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

exports.getUserData = async function (req, res) {
  /* #swagger.tags = ['User']
     #swagger.description = 'Endpoint to fetch user data by token' 
  */
  try {
    return res.status(200).json({
      success: true,
      data: req.user,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

exports.getByNIM = async function (req, res) {
  /* #swagger.tags = ['User']
     #swagger.description = 'Endpoint to get user by NIM' 
  */
  try {
    let users = await User.query().where("nim", "=", req.params.nim);
    if (users.length > 0) {
      return res.status(200).json({
        success: true,
        data: users,
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "Data tidak ditemukan!",
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
    const otp = Math.floor(100000 + Math.random() * 900000);
    bcrypt.hash(data.password, 10).then(async (hashedPassword) => {
      await User.query()
        .insert({
          nim: data.nim,
          nama: data.nama,
          prodi: data.prodi,
          email: data.email,
          no_hp: data.no_hp,
          otp: otp,
          password: hashedPassword,
        })
        .returning(["id", "nim", "nama", "email", "no_hp", "prodi"])
        .then(async (users) => {
          if (data.email) {
            const queryProdi = await MProdi.query()
              .where("kdprodi", "=", users.prodi)
              .limit(1);
            users.prodi_id = users.prodi;
            users.prodi = queryProdi[0].namaprodi;
            // data jwt
            const data_jwt = {
              id: users.id,
              nama: users.nama,
              nim: users.nim,
              prodi_id: users.prodi_id,
              prodi: users.prodi,
              email: users.email,
              no_hp: users.no_hp,
              status: 0, // default
            };
            const jwt_token = jwt.sign(data_jwt, process.env.API_SECRET);
            await sendEmailOnCreateUserWithTemplate(users);
            return res.status(200).json({
              success: true,
              message:
                "Anda Berhasil Terdaftar di Sistem Informasi Pembayaran Teknik Unitomo!",
              data: data_jwt,
              jwt_token,
            });
          }
        })
        .catch((error) => {
          if (error.nativeError) {
            if (error.nativeError.code == 23505) {
              return res.json({
                success: false,
                message: `Registrasi Gagal, ${error.columns} sudah terdaftar!`,
              });
            }
          }
          return res.json({
            success: false,
            message: `Registrasi Gagal, ${error}`,
          });
        });
    });
  } catch (error) {
    console.log(error);
    return res.json({
      success: false,
      message: "Registrasi Gagal, Internal server error !",
    });
  }
};

exports.otpVerification = async function (req, res) {
  /* #swagger.tags = ['User']
     #swagger.description = 'Endpoint to verifikasi OTP user' 
  */
  /* #swagger.security = [{
    "apiKeyAuth": []
  }] */

  try {
    let users = await User.query().where("id", "=", req.user.id);
    if (users.length > 0) {
      if (users[0].otp == req.params.otp) {
        await User.query()
          .patch({
            status: 1,
            updated_at: moment(new Date()).format("YYYY-MM-DD HH:mm:ss"),
          })
          .where("id", req.user.id);
        return res.status(200).json({
          success: true,
          message: "Berhasil melakukan verifikasi",
        });
      }
      return res.status(400).json({
        success: false,
        message: "Kode OTP Tidak Valid!",
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "Data tidak ditemukan!",
      });
    }
  } catch (error) {
    console.log(error);
    return res.json({
      success: false,
      message: "Verifikasi Gagal, Internal server error !",
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
    schema: { $ref: '#/definitions/UpdateUserRequestFormat' }
  } */

  const data = req.body;
  // Check Form Validation
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  try {
    await User.query()
      .patch({
        nim: data.nim,
        nama: data.nama,
        prodi: data.prodi,
        no_hp: data.no_hp,
        email: data.email,
        updated_at: moment(new Date()).format("YYYY-MM-DD HH:mm:ss"),
      })
      .where("id", req.user.id)
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
    res.status(500).json({
      success: false,
      message: "Data user gagal di Update !",
    });
  }
};

exports.updatePassword = async function (req, res) {
  /* #swagger.tags = ['User']
    #swagger.description = 'Endpoint untuk mengUpdate password User' */
  /* #swagger.parameters['body'] = {
    name: 'user',
    in: 'body',
    description: 'User information.',
    required: true,
    schema: { $ref: '#/definitions/UpdatePasswordRequestFormat' }
  } */

  const data = req.body;
  // Check Form Validation
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  try {
    const cek_user = await User.query().where("id", req.user.id);
    console.log("CEK USER:", cek_user);
    // Cek Jika data ada, maka beri return Data Email dna Username sudah terdaftar;
    if (cek_user.length == 0) {
      return res.status(400).json({
        success: false,
        message: "User Tidak Terdaftar!",
      });
    } else {
      bcrypt
        .compare(data.password, cek_user[0].password)
        .then(async (isAuthenticated) => {
          if (!isAuthenticated) {
            res.json({
              success: false,
              message: "Password yang Anda masukkan, salah!",
            });
          } else {
            bcrypt.hash(data.new_password, 10).then(async (hashedPassword) => {
              await User.query()
                .patch({
                  password: hashedPassword,
                  updated_at: moment(new Date()).format("YYYY-MM-DD HH:mm:ss"),
                })
                .where("id", id)
                .returning(["nama"])
                .first()
                .then(async (users) => {
                  if (data.email) {
                    await sendEmailUpdatePasswordWithTemplate({
                      nama: users.nama,
                      email: cek_user[0].email,
                    });
                    return res.status(200).json({
                      success: true,
                      message: "Anda Berhasil Mengupdate Password!",
                    });
                  }
                })
                .catch((err) => {
                  res.status(400).json({
                    success: false,
                    message: "Gagal Mengubah Password!",
                  });
                });
            });
          }
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

exports.resendVerification = async function (req, res) {
  /* #swagger.tags = ['User']
    #swagger.description = 'Endpoint untuk mengirim ulang OTP' */
  try {
    const cek_user = await knex.raw(
      `select u.*, mp.namaprodi from users u join m_prodi mp on mp.kdprodi = u.prodi where u.id='${req.user.id}'`
    );
    // Cek Jika data ada, maka beri return Data Email dna Username sudah terdaftar;
    if (cek_user.rows.length == 0) {
      return res.status(400).json({
        success: false,
        message: "User Tidak Terdaftar!",
      });
    } else {
      const users = cek_user.rows[0];
      await sendEmailOnCreateUserWithTemplate(users);
      return res.status(200).json({
        success: true,
        message: "Silahkan cek ulang email Anda!",
      });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false,
      message: "Internal server error!",
    });
  }
};

exports.forgotPassword = async function (req, res) {
  /* #swagger.tags = ['User']
    #swagger.description = 'Endpoint untuk mengirim request lupa password' */
  /* #swagger.parameters['body'] = {
    name: 'user',
    in: 'body',
    description: 'User information.',
    required: true,
    schema: { $ref: '#/definitions/ForgotPasswordRequestFormat' }
  } */
  /* #swagger.security = [{
    "apiKeyAuth": []
  }] */

  const data = req.body;
  // Check Form Validation
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  try {
    const email = data.email;
    const cek_user = await User.query().where("email", email);
    // Cek Jika data ada, maka beri return Data Email dna Username sudah terdaftar;
    if (cek_user.length == 0) {
      return res.status(400).json({
        success: false,
        message: "User Tidak Terdaftar!",
      });
    } else {
      const otp = Math.floor(100000 + Math.random() * 900000);
      await User.query()
        .patch({
          otp: otp,
          updated_at: moment(new Date()).format("YYYY-MM-DD HH:mm:ss"),
        })
        .where("email", email)
        .returning(["nama"])
        .first()
        .then(async (users) => {
          await sendEmailForgotPasswordWithTemplate({
            otp: otp,
            nama: users.nama,
            email: email,
          });
          return res.status(200).json({
            success: true,
            message: "Silahkan cek email Anda untuk mendapatkan kode OTP!",
          });
        })
        .catch((err) => {
          console.log("ERROR LUPA PASSWORD : ", err);
          res.status(400).json({
            success: false,
            message: "Gagal Meminta OTP baru!",
          });
        });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false,
      message: "Internal server error!",
    });
  }
};

exports.resetPassword = async function (req, res) {
  /* #swagger.tags = ['User']
    #swagger.description = 'Endpoint untuk mereset password' */
  /* #swagger.parameters['body'] = {
    name: 'user',
    in: 'body',
    description: 'User information.',
    required: true,
    schema: { $ref: '#/definitions/ResetPasswordRequestFormat' }
  } */
  /* #swagger.security = [{
    "apiKeyAuth": []
  }] */

  const data = req.body;
  // Check Form Validation
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  try {
    const email = data.email;
    const cek_user = await User.query().where("email", email);
    // Cek Jika data ada, maka beri return Data Email dna Username sudah terdaftar;
    if (cek_user.length == 0) {
      return res.status(400).json({
        success: false,
        message: "User Tidak Terdaftar!",
      });
    } else {
      bcrypt.hash(data.password, 10).then(async (hashedPassword) => {
        await User.query()
          .patch({
            password: hashedPassword,
            updated_at: moment(new Date()).format("YYYY-MM-DD HH:mm:ss"),
          })
          .where("email", email)
          .returning(["nama"])
          .first()
          .then(async (users) => {
            if (data.email) {
              await sendEmailUpdatePasswordWithTemplate({
                nama: users.nama,
                email: email,
              });
              return res.status(200).json({
                success: true,
                message: "Anda Berhasil Mereset Password!",
              });
            }
          })
          .catch((err) => {
            res.status(400).json({
              success: false,
              message: "Gagal Mereset Password!",
            });
          });
      });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false,
      message: "Internal server error!",
    });
  }
};

exports.delete = async function (req, res) {
  /* #swagger.tags = ['User']
     #swagger.description = 'Endpoint to delete user by id' 
  */
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
    const nim = data.nim;
    const password = data.password;

    const cek_user = await knex.raw(
      `select u.*, mp.namaprodi from users u join m_prodi mp on mp.kdprodi = u.prodi where u.nim='${nim}'`
    );
    if (cek_user.rows.length > 0) {
      const data_user = cek_user.rows[0];
      bcrypt
        .compare(`${password}`, data_user.password)
        .then(async (isAuthenticated) => {
          if (!isAuthenticated) {
            res.status(400).json({
              success: false,
              message: "Password yang Anda masukkan, salah!",
            });
          } else {
            const data_jwt = {
              id: data_user.id,
              nama: data_user.nama,
              nim: data_user.nim,
              prodi_id: data_user.prodi,
              prodi: data_user.namaprodi,
              email: data_user.email,
              no_hp: data_user.no_hp,
              status: data_user.status,
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
        message: "NIM tidak terdaftar!",
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
