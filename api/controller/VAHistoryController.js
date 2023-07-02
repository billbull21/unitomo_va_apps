const VAHistory = require("../model/VAHistory");
import extend from './../../node_modules/.staging/moment-8c48bd13/src/lib/utils/extend';
const axios = require('axios');
const moment = require('moment');

const { validationResult } = require("express-validator");

exports.getVAHistory = async function (req, res) {
  /* #swagger.tags = ['VAHistory']
    #swagger.description = 'Endpoint to get va history' 
*/
  try {
    let queryResult = await VAHistory.query().where("user_id", req.user.id).orderBy("updated_at", "desc");
    return res.status(200).json({
      success: true,
      data: queryResult,
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
      axios.post('https://jatimva.bankjatim.co.id/Va/CheckStatus', dataVa)
      .then(response => {
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
      .catch(async error => {
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

    // Add one day to the current date and time
    const futureTime = currentTime.add(1, 'day');

    await VAHistory.query()
      .insert({
        user_id: req.user.id,
        va: data.va,
        payment_category: data.payment_category,
        nominal: data.nominal,
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
          "Nama": req.user.nama,
          "TotalTagihan": data.nominal,
          "TanggalExp": formattedTime,
          "Berita1": data.payment_category,
          "Berita2": "-",
          "Berita3": "-",
          "Berita4": "-",
          "Berita5": "-",
          "FlagProses": 1,
        };
        // CALL API FROM BANK JATIM
        axios.post('https://apps.bankjatim.co.id/Api/Registrasi', dataVa)
        .then(response => {
          return res.status(200).json({
            success: true,
            message: "Anda Berhasil Mengisi Riwayat Pembayaran!",
            data: result,
          });
        })
        .catch(async error => {
          console.log("ERROR SAVE VA TO BANK JATIM : ", error);
          await VAHistory.query().deleteById(result.id);
          return res.status(400).json({
            success: false,
            message: `Registrasi Gagal, due to Bank Jatim Server!`,
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
  /* #swagger.tags = ['User']
     #swagger.description = 'Endpoint to delete va by id' 
  */
  try {
    let users = await VAHistory.query().deleteById(req.params.id);
    if (users == 1) {
      res.status(200).json({
        success: true,
        message: "Data berhasil dihapus!",
      });
    } else {
      res.status(400).json({
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
