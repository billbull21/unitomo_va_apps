const { Model } = require("objection");
const knex = require("../../db/knex");
Model.knex(knex);
class VAHistory extends Model {
  static get tableName() {
    return "t_va_user";
  }
  static get idColumn() {
    return ["id"];
  }
}
module.exports = VAHistory;
