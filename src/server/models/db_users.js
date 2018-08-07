const Sequelize = require('sequelize');

const mysql = require('../middlewares/sequelize');

const pwdLib = require('../middlewares/password');

const schema = {
  username: {
    type: Sequelize.STRING(32),
    unique: true,
    allowNull: false
  },
  password: {
    type: Sequelize.STRING(256),
    allowNull: false,
    set: function (val) {
      this.setDataValue('password', pwdLib.convert(val));
    }
  },
  identity: {
    type: Sequelize.ENUM,
    values: ['student', 'teacher'],
    allowNull: false
  }
};

const options = {
  underscored: true
};

const User = mysql.define('user', schema, options);

module.exports = User;
