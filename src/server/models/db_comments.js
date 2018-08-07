const Sequelize = require('sequelize');

const mysql = require('../middlewares/sequelize');

const schema = {
  comment_id: {
    type: Sequelize.INTEGER(11),
    autoIncrement: true,
    primaryKey: true,
    unique: true
  },
  content: {
    type: Sequelize.STRING,
    allowNull: false
  }
};

const options = {
  underscored: true
};

const Comment = mysql.define('comment', schema, options);

module.exports = Comment;
