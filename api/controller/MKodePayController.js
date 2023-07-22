const knex = require("../../db/knex");

exports.getMasterKodePay = async function (req, res) {
  /* #swagger.tags = ['MKodePay']
    #swagger.description = 'Endpoint to get all master prodi' 
  */
  try {
    let userID = req.user.prodi_id;
    if (req.params.id) userID = req.params.id;
    const queryResult = await knex.raw(
      `select * from m_kode_pay where (coalesce(kdprodi, '') = '' or kdprodi = '${userID}')`
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
