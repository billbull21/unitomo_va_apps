const VAHistory = require("../model/VAHistory");
const axios = require('axios');
const moment = require('moment');
const knex = require("../../db/knex");

const { validationResult } = require("express-validator");

// must less than 30000 => timeout setting in the app
const axiosTimeout = 20000;

exports.getAllVAHistory = async function (req, res) {
  /* #swagger.tags = ['VAHistory']
    #swagger.description = 'Endpoint to get va history' 
*/
  try {
    const search = req.query.search != null ? req.query.search : "";
    const page = req.query.page != null ? req.query.page : 1;
    const limit = req.query.limit != null ? req.query.limit : 10;
    const offset = (page - 1) * limit;
    let queryResult = await knex.raw(
      `select * from t_va_user where concat(va, va_name, payment_category) ilike '%${search}%' ORDER BY created_at DESC offset ${offset} limit ${limit}`
    );
    console.log("QUERY RESULT :: ", queryResult);
    return res.status(200).json({
      success: true,
      data: queryResult.rows,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

exports.getVAHistory = async function (req, res) {
  /* #swagger.tags = ['VAHistory']
    #swagger.description = 'Endpoint to get va history' 
*/
  try {
    const search = req.query.search != null ? req.query.search : "";
    const page = req.query.page != null ? req.query.page : 1;
    const limit = req.query.limit != null ? req.query.limit : 10;
    const offset = (page - 1) * limit;
    let queryResult = await knex.raw(
      `select * from t_va_user where concat(va, va_name, payment_category) ilike '%${search}%' and user_id = '${req.user.id}' order by created_at desc offset ${offset} limit ${limit}`
    );
    return res.status(200).json({
      success: true,
      data: queryResult.rows,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

exports.getVAHistoryByID = async function (req, res) {
  /* #swagger.tags = ['VAHistory']
    #swagger.description = 'Endpoint to get va history' 
*/
  try {
    let queryResult = await VAHistory.query().where("id", req.params.id).limit(1);
    if (queryResult.isEmpty) {
      return res.status(400).json({
        success: true,
        message: "Data tidak ditemukan!",
      });
    }
    // CALL API FROM BANK JATIM
    if (queryResult[0].status != "DONE") {
      const dataVa = {
        "VirtualAccount": queryResult[0].va,
      };
      axios.post('https://jatimva.bankjatim.co.id/Va/CheckStatus', dataVa, { timeout: axiosTimeout })
      .then((response) => {
        const responseData = response.data;
        if (responseData != null && responseData.FlagLunas == "Y") {
          VAHistory.query()
          .patch({
            status: "DONE",
            updated_at: moment(new Date()).format("YYYY-MM-DD HH:mm:ss"),
          })
          .where("id", req.params.id)
          .first()
          .then((resp) => {
            res.status(200).json({
              success: true,
              message: "Data va berhasil di Update",
              data: resp,
            });
          })
          .catch((err) => {
            res.status(400).json({
              success: false,
              message: "Data va gagal di Update!",
            });
          });
        }
        return res.status(200).json({
          success: true,
          data: queryResult[0],
        });
      })
      .catch(async (error) => {
        return res.status(400).json({
          success: false,
          message: `Gagal mengambil detail, due to Bank Jatim Server!`,
        });
      });
    } else {
      return res.status(200).json({
        success: true,
        data: queryResult[0],
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

exports.insertVA = async function (req, res) {
  /* #swagger.tags = ['VAHistory']
    #swagger.description = 'Endpoint to insert va history' 
  */
  /* #swagger.parameters['body'] = {
    name: 'VAHistory',
    in: 'body',
    description: 'Payment information.',
    required: true,
    schema: { $ref: '#/definitions/VAHistoryRequestFormat' }
  } */

  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    const data = req.body;

    const currentTime = moment(); // Current date and time

    var maxExpired = 3;
    if (data.parsial) maxExpired = 18;

    // Add one day to the current date and time
    const futureTime = currentTime.add(maxExpired, 'month');

    var userID = req.user.id;
    var vaName = req.user.nama;

    // admin can create va for other users
    if (req.user.isAdmin && data.user_id) {
      userID = data.user_id;
    }
    if (req.user.isAdmin && data.va_name) {
      vaName = data.va_name;
    }

    await VAHistory.query()
      .insert({
        user_id: userID,
        va: data.va,
        payment_category: data.payment_category,
        nominal: data.nominal,
        va_name: vaName,
        expired_date: futureTime.format('YYYY-MM-DD HH:mm:ss'),
      })
      .returning([
        "id",
        "user_id",
        "va",
        "payment_category",
        "nominal",
        "created_at",
      ])
      .then(async (result) => {

        // Format the future time
        const formattedTime = futureTime.format('YYYYMMDD');

        const dataVa = {
          "VirtualAccount": data.va,
          "Nama": vaName,
          "TotalTagihan": data.nominal,
          "TanggalExp": formattedTime,
          "Berita1": data.payment_category,
          "Berita2": "-",
          "Berita3": "-",
          "Berita4": "-",
          "Berita5": "-",
          "FlagProses": 1,
        };
        var url = "https://jatimva.bankjatim.co.id/Va/RegPen";
        if (data.parsial) {
          url = "https://jatimva.bankjatim.co.id/Va/Reg";
        }
        // CALL API FROM BANK JATIM
        axios.post(url, dataVa, { timeout: axiosTimeout })
        .then((response) => {
          return res.status(200).json({
            success: true,
            message: "Anda Berhasil Mengisi Riwayat Pembayaran!",
            data: result,
          });
        })
        .catch(async (error) => {
          console.log("ERROR SAVE VA TO BANK JATIM : ", error);
          VAHistory.query().deleteById(result.id)
          .then(resDel => res.status(400).json({
            success: false,
            message: `Generate VA Gagal, due to Bank Jatim Server!`,
          }))
          .catch(errDel => {
            console.log('ERROR DELETE', errDel);
            return res.status(400).json({
              success: false,
              message: `Registrasi VA Gagal, due to Bank Jatim Server!`,
            })
          });
        });
      })
      .catch((error) => {
        console.log("ERROR SAVE", error);
        if (error.nativeError) {
          if (error.nativeError.code == 23505) {
            return res.status(400).json({
              success: false,
              message: `Maaf, no. ${error.columns} sudah dibuat sebelumnya!`,
            });
          }
        }
        return res.status(400).json({
          success: false,
          message: `Registrasi Gagal`,
        });
      });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Input data failed, Internal server error !",
    });
  }
};

exports.extendVAExpiredDate = async function (req, res) {
  /* #swagger.tags = ['VAHistory']
    #swagger.description = 'Endpoint to extend VA expired DATE' 
  */
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });

    const { isParsial } = req.query;
    
    const transaction = await knex.transaction();

    const currentTime = moment(); // Current date and time

    var maxExpired = 3;
    if (isParsial) maxExpired = 18;

    // set max expired
    const futureTime = currentTime.add(maxExpired, 'month');

    const result = await VAHistory.query(transaction)
      .patch({
        expired_date: futureTime.format('YYYY-MM-DD HH:mm:ss'),
        updated_at: moment(new Date()).format("YYYY-MM-DD HH:mm:ss"),
      })
      .where("va", req.params.va)
      //.andWhere("status", )
      .returning([
        "id",
        "user_id",
        "va",
        "va_name",
        "payment_category",
        "nominal",
        "created_at",
      ]);

    // Format the future time
    const formattedTime = futureTime.format('YYYYMMDD');

    const dataVa = {
      "VirtualAccount": result.va,
      "Nama": result.va_name,
      "TotalTagihan": result.nominal,
      "TanggalExp": formattedTime,
      "Berita1": result.payment_category,
      "Berita2": "-",
      "Berita3": "-",
      "Berita4": "-",
      "Berita5": "-",
      "FlagProses": 2, // update
    };
    var url = "https://jatimva.bankjatim.co.id/Va/RegPen";
    if (isParsial) {
      url = "https://jatimva.bankjatim.co.id/Va/Reg";
    }
    // CALL API FROM BANK JATIM
    try {
      await axios.post(url, dataVa, { timeout: axiosTimeout });
      await transaction.commit();

      // logging
      // await Log.query().insert({
      //   table_lookup: "t_va_user",
      //   actions: "Extend Expired Date VA",
      //   id_trans: resultSave.id,
      //   id_user: userID,
      //   ip_address: ip_address_client,
      //   user_agent: user_agent_client,
      //   keterangan: "",
      //   additional_info: {},
      // });

      return res.status(200).json({
        success: true,
        message: "Anda Berhasil Menambah Masa Expired Pembayaran!",
        data: result,
      });
    } catch (errorBankJatim) {
      console.log("ERROR UPDATE VA TO BANK JATIM : ", errorBankJatim);
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: `Maaf, terjadi kesalahan pada sistem bank jatim!`,
      });
    }
  } catch (error) {
    console.log(error);
    await transaction.rollback();
    if (error.nativeError) {
      if (error.nativeError.code == 23505) {
        return res.status(400).json({
          success: false,
          message: `Maaf, no. ${error.columns} sudah dibuat sebelumnya!`,
        });
      }
    }
    return res.status(500).json({
      success: false,
      message: "Input data failed, Internal server error !",
    });
  }
};

// exports.extendVAExpiredDate = async function (req, res) {
//   /* #swagger.tags = ['VAHistory']
//     #swagger.description = 'Endpoint to get va history' 
// */
//   try {
//     let queryResult = await VAHistory.query().where("id", req.params.id).limit(1);
//     if (queryResult.isEmpty) {
//       return res.status(400).json({
//         success: true,
//         message: "Data tidak ditemukan!",
//       });
//     }
//     // CALL API FROM BANK JATIM
//     if (queryResult[0].status != "DONE") {
//       const dataVa = {
//         "VirtualAccount": queryResult[0].va,
//       };
//       VAHistory.query()
//       .patch({
//         status: "DONE",
//         updated_at: moment(new Date()).format("YYYY-MM-DD HH:mm:ss"),
//       })
//       .where("id", req.params.id)
//       .first()
//       .then((resp) => {
//         res.status(200).json({
//           success: true,
//           message: "Data va berhasil di Update",
//           data: resp,
//         });
//       })
//       .catch((err) => {
//         res.status(400).json({
//           success: false,
//           message: "Data va gagal di Update!",
//         });
//       });
//     } else {
//       return res.status(200).json({
//         success: true,
//         data: queryResult[0],
//       });
//     }
//   } catch (err) {
//     console.log(err);
//     return res.status(500).json({
//       success: false,
//       message: "Internal server error",
//     });
//   }
// };

exports.delete = async function (req, res) {
  /* #swagger.tags = ['VAHistory']
     #swagger.description = 'Endpoint to delete va by id' 
  */
  try {
    // let users = await VAHistory.query().deleteById(req.params.id);
    // if (users == 1) {
    //   res.status(200).json({
    //     success: true,
    //     message: "Data berhasil dihapus!",
    //   });
    // } else {
    //   res.status(400).json({
    //     success: false,
    //     message: "Data tidak ditemukan!",
    //   });
    // }
    return res.status(400).json({
      success: false,
      message: "Anda tidak bisa hapus data!",
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
