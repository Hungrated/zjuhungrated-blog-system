const express = require('express');
const pathLib = require('path');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const cookieSession = require('cookie-session');
const compression = require('compression');
const path = require('./app_paths');

const app = express();
app.disable('x-powered-by');

app.use(compression());

// bodyParser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: false
}));

// cookie handler
app.use(cookieParser());

let arr = [];
for (let i = 0; i < 800; i++) {
  arr.push('keys_' + Math.random());
}
app.use(cookieSession({
  name: 'session_id',
  secret: 'floating-cloud-plus',
  maxAge: 3600 * 24 * 3 * 1000
}));

// static resources handler
app.use(express.static(pathLib.join(__dirname, 'public')));

// backend routes handler
const api = require('./routes/route_api');
app.use('/api', api);
app.use('/images', express.static(path.images));

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  let err = new Error('Not Found');
  console.log(err);
  err.status = 404;
  next();
});

// error handler
app.use(function (req, res) {
  res.send('Not found.');
});

// cross-domain access
app.use('*', function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'X-Requested-With');
  res.header('Access-Control-Allow-Methods', 'PUT,POST,GET,DELETE,OPTIONS');
  res.header('Content-Type', 'application/json;charset=utf-8');
  next();
});

module.exports = app;
