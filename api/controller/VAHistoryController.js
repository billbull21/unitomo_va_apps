var VAHistory = require("../model/VAHistory");
const { validationResult } = require("express-validator");

exports.getVAHistory = async function (req, res) {
  /* #swagger.tags = ['VAHistory']
    #swagger.description = 'Endpoint to get va history' 
*/
  try {
    let queryResult = await VAHistory.query().where("user_id", req.user.id);
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
    console.log("ERROR", errors);
    if (!errors.isEmpty())
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    const data = req.body;
    await VAHistory.query()
      .insert({
        user_id: req.user.id,
        va: data.va,
        payment_category: data.payment_category,
        nominal: data.nominal,
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
        return res.status(200).json({
          success: true,
          message: "Anda Berhasil Mengisi Riwayat Pembayaran!",
          data: result,
        });
      })
      .catch((error) => {
        console.log("ERR:", error);
        return res.json({
          success: false,
          message: `Input data failed, ${error.nativeError.detail} `,
        });
      });
  } catch (error) {
    console.log(error);
    return res.json({
      success: false,
      message: "Input data failed, Internal server error !",
    });
  }
};

exports.updateStatusVA = async function (req, res) {
  /* #swagger.tags = ['VAHistory']
    #swagger.description = 'Endpoint to make it 'DONE' status va history' 
*/

  try {
    const errors = validationResult(req);
    console.log("ERROR", errors);
    if (!errors.isEmpty())
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    await VAHistory.query()
      .patch({
        status: "DONE",
      })
      .where("id", "=", req.params.id)
      .then(async (result) => {
        return res.status(200).json({
          success: true,
          message: "Anda Berhasil Menyelesaikan Pembayaran!",
        });
      })
      .catch((error) => {
        console.log("ERR:", error);
        return res.json({
          success: false,
          message: `Registrasi Gagal, ${error.nativeError.detail} `,
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
