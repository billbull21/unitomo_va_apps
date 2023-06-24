const { Model } = require("objection");
const knex = require("../../db/knex");
const User = require("./User");
Model.knex(knex);
class MKodePay extends Model {
  static get tableName() {
    return "m_kode_pay";
  }
  static get idColumn() {
    return ["id"];
  }
}
module.exports = MKodePay;
