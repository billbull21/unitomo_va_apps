const { Model } = require("objection");
const knex = require("../../db/knex");
const User = require("./User");
Model.knex(knex);
class MProdi extends Model {
  static get tableName() {
    return "m_prodi";
  }
  static get idColumn() {
    return ["kdprodi"];
  }
}
module.exports = MProdi;
