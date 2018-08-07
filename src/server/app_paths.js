const pathLib = require('path');
const fs = require('fs');

const root = __dirname;

const host = 'http://localhost:3001';

const app = pathLib.join(root, 'app.js');

// file upload root
const files = pathLib.join(root, 'public', 'files');

// image dir
const images = pathLib.join(files, 'images');

const blogs = pathLib.join(images, 'blogs');

const avatars = pathLib.join(images, 'avatars');

const banner = pathLib.join(images, 'banner');

// source dir
const sources = pathLib.join(files, 'sources');

const plans = pathLib.join(files, 'plans');

const userinfo = pathLib.join(files, 'userinfo');

const final = pathLib.join(files, 'final');

const exportDir = pathLib.join(final, 'export');

// document dir
const apidoc = pathLib.join(root, 'public', 'apidoc');

// admin dir
const admin = pathLib.join(root, 'public', 'admin');

// make dir functions
const makeDir = function (dir) {
  fs.mkdir(dir, function (err) {
    if (err) {
      console.log('dir: `' + dir + '` exists.');
    } else {
      console.log(dir + ' created.');
    }
  });
};

const mkdirIfNotExist = function (dir) {
  fs.access(dir, function (err) {
    if (err && err.code === 'ENOENT') {
      makeDir(dir);
    } else {
      console.log('dir: `' + dir + '` exists.');
    }
  });
};

mkdirIfNotExist(blogs);
mkdirIfNotExist(plans);
mkdirIfNotExist(final);
mkdirIfNotExist(exportDir);
mkdirIfNotExist(pathLib.join(blogs, '__temp__'));

module.exports = {
  app,
  host,
  files,
  images,
  blogs,
  plans,
  avatars,
  sources,
  userinfo,
  banner,
  final,
  exportDir,
  apidoc,
  admin
};
