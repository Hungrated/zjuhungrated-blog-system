const config = require('../config/default').database;
const crypto = require('crypto');

module.exports = {
  convert: function (password) {
    return crypto.createHash('sha256')
      .update(config.salt + password)
      .digest('hex').slice(0, 255);
  }
};
