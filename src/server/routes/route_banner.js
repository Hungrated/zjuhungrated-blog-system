const express = require('express');
const router = express.Router();

const validate = require('../middlewares/validate');

const db = require('../models/db_global');
const statusLib = require('../libs/status');

const uid = require('../middlewares/id_gen');
const Banner = db.Banner;

const path = require('../app_paths');
const pathLib = require('path');

const fs = require('fs');
const multer = require('multer');

const gm = require('gm').subClass({graphicsMagick: true});

let objMulter = multer({
  dest: path.banner
});

/**
 *
 * 获取首页轮播图列表
 *
 * @api {get} /api/banner banner.fetch
 * @apiName fetch
 * @apiGroup Banner
 * @apiVersion 0.2.0
 * @apiPermission all
 *
 * @apiDescription 获取首页轮播图列表。
 *
 * @apiSuccess {Array} data 轮播图列表
 * @apiSuccessExample {json} 成功返回示例
 * HTTP/1.1 200 OK
 * [
 *     {
 *         "img_id": "bnr7e8d5d",
 *         "src": "/api/download?banner=bnr7e8d5d.jpg",
 *         "status": "active",
 *         "created_at": "2018-01-26T09:19:36.000Z",
 *         "updated_at": "2018-01-26T09:19:36.000Z",
 *         "uploader_id": 40429
 *     },
 *     {
 *         "img_id": "bnr799d27",
 *         "src": "/api/download?banner=bnr799d27.jpg",
 *         "status": "active",
 *         "created_at": "2018-01-26T09:19:30.000Z",
 *         "updated_at": "2018-01-26T09:19:30.000Z",
 *         "uploader_id": 40429
 *     }
 * ]
 */
router.get('/', function (req, res) {
  Banner.findAll({
    where: {
      status: 'active'
    },
    order: [
      ['created_at', 'DESC']
    ]
  })
    .then(function (imgList) {
      console.log('banner fetch successful');
      res.json(imgList);
    })
    .catch(function (e) {
      console.error(e);
      res.json(statusLib.CONNECTION_ERROR);
    });
});

/**
 *
 * 上传首页轮播图
 *
 * @api {post} /api/banner/upload banner.upload
 * @apiName bannerUpload
 * @apiGroup Banner
 * @apiVersion 0.2.0
 * @apiPermission user.teacher
 *
 * @apiDescription 教师上传首页轮播图。上传方式为form-data。
 *
 * @apiParam {File} banner 轮播图
 * @apiParam {Number} uploader_id 上传者编号
 * @apiParamExample {formdata} 请求示例
 * {
 *     "banner": <banner.jpg>,
 *     "uploader_id": 40429
 * }
 *
 * @apiSuccess {Number} status 状态代码
 * @apiSuccess {String} msg 反馈信息
 * @apiSuccessExample {json} 成功返回示例
 * HTTP/1.1 200 OK
 * {
 *     "status": 8100,
 *     "msg": "轮播图上传成功"
 * }
 */
router.post('/upload', objMulter.any(), validate.validateTeacher, function (req, res, next) {
  // upload a banner img
  let id = 'bnr' + uid.generate();
  let filename = `${id}_${uid.generate()}.jpg`;
  req.body.img_id = id;
  req.bannerPath = pathLib.join(path.banner, filename);
  req.bannerUrl = path.host + '/images/banner/' + filename;
  console.log('banner upload successful');
  next();
});

router.post('/upload', function (req, res, next) {
  // compress & rename a banner file

  gm(req.files[0].path)
    .resize(960, 960)
    .quality(60)
    .write(req.bannerPath, function (err) {
      if (!err) {
        fs.unlinkSync(req.files[0].path);
        next();
      } else {
        console.log(err);
      }
    });
});

router.post('/upload', function (req, res) {
  // update database record
  Banner.create({
    img_id: req.body.img_id,
    status: 'active',
    uploader_id: req.body.school_id,
    src: req.bannerUrl
  })
    .then(function () {
      console.log('banner upload successful');
      res.json(statusLib.BANNER_IMG_UPLOAD_SUCCESSFUL);
    })
    .catch(function (e) {
      console.error(e);
      res.json(statusLib.CONNECTION_ERROR);
    });
});

/**
 *
 * 切换首页轮播图状态
 *
 * @api {post} /api/banner/switch banner.switch
 * @apiName bannerSwitch
 * @apiGroup Banner
 * @apiVersion 0.2.0
 * @apiPermission user.teacher
 *
 * @apiDescription 教师切换首页轮播图状态。
 *
 * @apiParam {String} img_id 轮播图编号
 * @apiParam {Number} op 操作：0 存档；1 活跃
 * @apiParamExample {json} 请求示例
 * {
 *     "img_id": "bnr7e8d5d",
 *     "op": 0
 * }
 *
 * @apiSuccess {Number} status 状态代码
 * @apiSuccess {String} msg 反馈信息
 * @apiSuccessExample {json} 成功返回示例
 * HTTP/1.1 200 OK
 * {
 *     "status": 8200,
 *     "msg": "轮播图状态更改成功"
 * }
 */
router.post('/switch', validate.validateTeacher, function (req, res) {
  Banner.update({
    status: req.body.op ? 'active' : 'archived' // 0: archived 1: active
  }, {
    where: {
      img_id: req.body.img_id
    }
  })
    .then(function () {
      res.json(statusLib.BANNER_IMG_STATUS_CHANGE_SUCCESSFUL);
      console.log('banner img status change successful');
    })
    .catch(function (e) {
      console.error(e);
      res.json(statusLib.BANNER_IMG_STATUS_CHANGE_FAILED);
      console.log('banner img status change failed');
    });
});

/**
 *
 * 修改当前首页轮播图
 *
 * @api {post} /api/banner/modify banner.modify
 * @apiName bannerModify
 * @apiGroup Banner
 * @apiVersion 0.2.0
 * @apiPermission user.teacher
 *
 * @apiDescription 教师修改首页轮播图。图片上传方式为form-data。
 *
 * @apiParam {File} banner 首页轮播图
 * @apiParam {String} img_id 轮播图编号
 * @apiParam {String} src 当前轮播图资源路径
 * @apiParamExample {formdata} 请求示例
 * {
 *     "banner": <banner.jpg>,
 *     "img_id": "bnr7e8d5d",
 *     "src": "http://[host]/images/banner/bnr7e8d5d_23cdff.jpg"
 * }
 *
 * @apiSuccess {Number} status 状态代码
 * @apiSuccess {String} msg 反馈信息
 * @apiSuccessExample {json} 成功返回示例
 * HTTP/1.1 200 OK
 * {
 *     "status": 8300,
 *     "msg": "轮播图更改成功"
 * }
 */
router.post('/modify', objMulter.any(), validate.validateTeacher, function (req, res, next) {
  // check existence of previous banner image file
  let oldUrl = req.body.src;
  let oldFilename = oldUrl.match(/banner\/(\S*)/)[1];
  let oldPath = pathLib.join(path.banner, oldFilename);

  fs.access(oldPath, function (err) {
    if (err && err.code === 'ENOENT') {
      console.log('delete: file no longer exists, skipped');
      next();
    } else {
      fs.unlink(oldPath, function (err) {
        if (err) {
          console.error(err);
          res.json(statusLib.CONNECTION_ERROR);
        } else {
          console.log('previous banner file deleted');
          next();
        }
      });
    }
  });
});

router.post('/modify', function (req, res, next) {
  let newFilename = `${req.body.img_id}_${uid.generate()}.jpg`;
  gm(req.files[0].path)
    .resize(960, 960)
    .quality(60)
    .write(pathLib.join(path.banner, newFilename), function (err) {
      if (!err) {
        fs.unlinkSync(req.files[0].path);
        req.newBannerSrc = path.host + '/images/banner/' + newFilename;
        next();
      } else {
        console.log(err);
      }
    });
});

router.post('/modify', function (req, res) {
  Banner.update({
    src: req.newBannerSrc
  }, {
    where: {
      img_id: req.body.img_id
    }
  })
    .then(function () {
      res.json(statusLib.BANNER_IMG_MOD_SUCCESSFUL);
      console.log('banner img mod successful');
    })
    .catch(function (e) {
      console.error(e);
      res.json(statusLib.MOMENT_FETCH_FAILED);
      console.log('moment fetch failed');
    });

});

module.exports = router;
