const knex = require("../../db/knex");

exports.getMasterKodePay = async function (req, res) {
  /* #swagger.tags = ['MKodePay']
    #swagger.description = 'Endpoint to get all master prodi' 
  */
  try {
    let userID = req.user.prodi_id;
    if (req.params.id) userID = req.params.id;
    // if admin can show all
    var query = `select * from m_kode_pay`;
    if (!req.user.isAdmin) {
      query += ` where (coalesce(kdprodi, '') = '' or kdprodi = '${userID}')`;
    }
    const queryResult = await knex.raw(query);
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
