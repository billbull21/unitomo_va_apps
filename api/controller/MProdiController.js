var MProdi = require("../model/MProdi");

exports.getMasterProdi = async function (req, res) {
  /* #swagger.tags = ['MProdi']
    #swagger.description = 'Endpoint to get all master prodi' 
*/
  /* #swagger.security = [{
    "apiKeyAuth": []
  }] */
  try {
    let queryResult = await MProdi.query();
    return res.status(200).json({
      success: true,
      data: queryResult ?? [],
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
