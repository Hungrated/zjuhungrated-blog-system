const jwt = require('jwt-simple');
const statusLib = require('../libs/status');
const tokenLib = require('config-lite')(__dirname).token;

module.exports.validateTeacher = function (req, res, next) {
  const token = req.cookies['token'] || '';
  if (token !== '') {
    let payload = jwt.decode(token, tokenLib.secret);
    if (payload.exp && payload.type === 'teacher' && Date.now() < payload.exp) {
      req.body.school_id = payload.sid;
      next();
    } else {
      res.clearCookie('token');
      res.json(statusLib.VALIDATE_FAILED);
    }
  } else {
    res.json(statusLib.NOT_YET_LOGGED_IN);
  }
};

module.exports.validateAdmin = function (req, res, next) {
  // this function should be used after function validateTeacher
  const token = req.body.token;
  if (token && token === 'innovation') {
    next();
  } else {
    res.json(statusLib.VALIDATE_FAILED);
  }
};

module.exports.validateUser = function (req, res, next) {
  const token = req.cookies['token'] || '';
  if (token !== '') {
    let payload = jwt.decode(token, tokenLib.secret);
    if (payload.exp && Date.now() < payload.exp) {
      req.body.school_id = payload.sid;
      req.body.name = payload.name;
      req.body.class_id = payload.cid;
      next();
    } else {
      res.clearCookie('token');
      res.json(statusLib.VALIDATE_FAILED);
    }
  } else {
    res.json(statusLib.NOT_YET_LOGGED_IN);
  }
};
