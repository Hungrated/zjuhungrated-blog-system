const express = require('express');
const router = express.Router();

const validate = require('../middlewares/validate');

const sequelize = require('sequelize');
const db = require('../models/db_global');
const statusLib = require('../libs/status');
const pathLib = require('path');
const urlLib = require('url');
const timeFormat = require('../middlewares/time_format');
const uid = require('../middlewares/id_gen');
const path = require('../app_paths');

const multer = require('multer');
const fs = require('fs');

const moment = require('../middlewares/moment');

const File = db.File;
const Profile = db.Profile;

let objMulter = multer({
  dest: path.sources
});

/**
 *
 * 文件上传
 *
 * @api {post} /api/file/upload file.upload
 * @apiName fileUpload
 * @apiGroup File
 * @apiVersion 1.0.0
 * @apiPermission user
 *
 * @apiDescription 用户上传资源文件。上传方式为form-data。
 *
 * @apiParam {File} file 资源文件
 * @apiParam {String} group 文件分组
 * @apiParam {String} labels 文件标签列表
 * @apiParam {String} descriptions 文件描述
 * @apiParamExample {formdata} 请求示例
 * {
 *     "file": <file>,
 *     "group": "论文资料",
 *     "labels": "2,3,5,7",
 *     "descriptions": "A file"
 * }
 *
 * @apiSuccess {Number} status 状态代码
 * @apiSuccess {String} msg 反馈信息
 * @apiSuccessExample {json} 成功返回示例
 * HTTP/1.1 200 OK
 * {
 *     "status": 4000,
 *     "msg": "资源文件上传成功"
 * }
 */
router.post('/upload', objMulter.any(), validate.validateUser, function (req, res) {
  // upload files: multipart/form-data

  const schoolId = req.body.school_id;
  const fileDescriptions = req.body.descriptions.split(',');

  let flag = 0;

  for (let i = 0; i < req.files.length; i++) {
    // for each file uploaded
    // rename a file
    let newName = req.files[i].path + pathLib.parse(req.files[i].originalname).ext;
    let downloadUrl = '/api/download?resource=' + req.files[i].filename + pathLib.parse(req.files[i].originalname).ext;

    fs.rename(req.files[i].path, newName, function (err) {
      if (err) {
        console.log('file rename error');
        return res.json(statusLib.FILE_RENAME_FAILED);
      }
    });

    let fileInfo = {
      file_id: 'fil' + uid.generate(),
      filename: req.files[i].originalname,
      size: req.files[i].size,
      url: downloadUrl,
      group: req.body.group,
      labels: `,${req.body.labels},`,
      uploader_id: schoolId,
      description: fileDescriptions[i]
    };

    let extras = {
      desc: fileInfo.description,
      url: fileInfo.url,
      labels: req.body.labels
    };

    // create a record for table `files`
    File.create(fileInfo)
      .then(function () {
        flag++;
        if (flag === req.files.length) {
          moment.createMoment(
            'resource',
            fileInfo.filename,
            extras,
            fileInfo.uploader_id,
            fileInfo.file_id
          );
          res.json(statusLib.FILE_UPLOAD_SUCCESSFUL);
          console.log('file upload successful');
        }
      })
      .catch(function (e) {
        console.error(e);
        res.json(statusLib.CONNECTION_ERROR);
      });
  }
});

/**
 *
 * 获取文件列表
 *
 * @api {post} /api/file/query file.query
 * @apiName fileQuery
 * @apiGroup File
 * @apiVersion 0.4.3
 * @apiPermission user
 *
 * @apiDescription 获取资源文件列表。
 *
 * @apiParam request 查询条件："all"或用户编号
 *
 * @apiParamExample {json} 请求示例1
 * {
 *     "request": "all"
 * }
 * @apiParamExample {json} 请求示例2
 * {
 *     "request": 14051531
 * }
 *
 * @apiSuccess {Array} data 班级列表
 * @apiSuccessExample {json} 成功返回示例
 * HTTP/1.1 200 OK
 * {
 *     count: 2,
 *     rows: [
 *         {
 *             "file_id": "fil963a43",
 *             "labels": null,
 *             "filename": "bg02.jpg",
 *             "size": 17011752,
 *             "url": "/api/download?resource=55c9be61cb025487e99e04458ea52334.jpg",
 *             "description": "another background image",
 *             "created_at": "2018-01-30T05:34:25.000Z",
 *             "updated_at": "2018-01-30T05:34:25.000Z",
 *             "uploader_id": 14051531,
 *             "profile": {
 *                 "name": "章梓航"
 *             },
 *             "uploadTime": "2018-01-30 13:34:25"
 *         },
 *         {
 *             "file_id": "fil4e108b",
 *             "labels": null,
 *             "filename": "bg01.jpg",
 *             "size": 15936775,
 *             "url": "/api/download?resource=9405ba39a6fbffd4e8c673a529316ed6.jpg",
 *             "description": "a background image",
 *             "created_at": "2018-01-30T05:34:09.000Z",
 *             "updated_at": "2018-01-30T05:34:09.000Z",
 *             "uploader_id": 14051531,
 *             "profile": {
 *                 "name": "章梓航"
 *             },
 *             "uploadTime": "2018-01-30 13:34:09"
 *         }
 *     ]
 * }
 */
router.post('/query', function (req, res) {
  const request = req.body.request;
  let query = urlLib.parse(req.url, true).query;
  let where = {};
  let limit = query.limit ? Number(query.limit) : 15;
  let offset = query.page ? limit * (Number(query.page) - 1) : 0;
  if (typeof request === 'string' && request !== 'all') {
    where = {
      type: request
    };
  }
  if (typeof request === 'number') {
    where = {
      uploader_id: request
    };
  }
  if (typeof request === 'object') {
    if (!!request.group && request.group !== '所有资源') {
      where.group = request.group;
    }
    if (request.labels) {
      where.labels = {
        $or: []
      };
      let labelArr = request.labels.toString().split(',');
      for (let i = 0; i < labelArr.length; i++) {
        where.labels.$or.push({
          $like: `%,${labelArr[i]},%`
        });
      }
    }
  }
  File.findAndCount({
    where: where,
    limit: limit,
    offset: offset,
    order: [
      ['created_at', 'DESC']
    ],
    include: [{
      model: Profile,
      where: {
        school_id: sequelize.col('file.uploader_id')
      },
      attributes: ['name']
    }]
  })
    .then(function (files) {
      for (let i = 0; i < files.rows.length; i++) {
        files.rows[i].dataValues.uploadTime = timeFormat(files.rows[i].dataValues.created_at);
        files.rows[i].dataValues.labels = files.rows[i].dataValues.labels.slice(1);
      }
      res.json(files);
      console.log('file list fetch successful');
    })
    .catch(function (e) {
      console.error(e);
      res.json(statusLib.CONNECTION_ERROR);
    });
});

module.exports = router;
