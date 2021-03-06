const express = require('express');
const router = express.Router();

const validate = require('../middlewares/validate');

const db = require('../models/db_global');
const statusLib = require('../libs/status');

const moment = require('../middlewares/moment');

const Label = db.Label;

/**
 *
 * 查询标签（用于编辑时获取添加）
 *
 * @api {post} /api/label/query label.query
 * @apiName labelQuery
 * @apiGroup Label
 * @apiVersion 0.3.0
 * @apiPermission user
 *
 * @apiDescription 查询类型标签。
 *
 * @apiParam {String} type 标签类型 可选： blog|file|both
 *
 * @apiParamExample {json} 请求示例
 * {
 *     "name": "JavaScript",
 *     "type": "blog",
 *     "adder_id": 40429
 * }
 *
 * @apiSuccess {Array} labelArr 标签详细信息
 * @apiSuccessExample {json} 成功返回示例
 * HTTP/1.1 200 OK
 * [
 *     {
 *         "label_id": 1,
 *         "name": "JavaScript",
 *         "category": "blog",
 *         "created_at": "2018-02-26T10:41:18.000Z",
 *         "updated_at": "2018-02-26T10:41:18.000Z",
 *         "adder_id": 40429
 *     },
 *     {
 *         "label_id": 2,
 *         "name": "TypeScript",
 *         "category": "blog",
 *         "created_at": "2018-02-27T14:50:28.000Z",
 *         "updated_at": "2018-02-27T14:50:28.000Z",
 *         "adder_id": 40429
 *     }
 * ]
 *
 */
router.post('/query', function (req, res) {
  let type = req.body.type || 'all';
  let ops = type === 'all'
    ? {} : {
      where: {
        $or: [
          {
            category: 'both'
          },
          {
            category: req.body.type
          }
        ]
      }
    };
  Label.findAll(ops)
    .then(function (labels) {
      res.json(labels);
      console.log('label query successful');
    })
    .catch(function (e) {
      console.error(e);
      res.json(statusLib.CONNECTION_ERROR);
      console.log('label query failed');
    });
});

/**
 *
 * 新增标签
 *
 * @api {post} /api/label/submit label.submit
 * @apiName labelSubmit
 * @apiGroup Label
 * @apiVersion 0.3.0
 * @apiPermission user.teacher
 *
 * @apiDescription 教师新增类型标签。
 *
 * @apiParam {String} name 标签名
 * @apiParam {String} category 标签类型 可选： blog|file|both
 *
 * @apiParamExample {json} 请求示例
 * {
 *     "name": "JavaScript",
 *     "category": "blog"
 * }
 *
 * @apiSuccess {Number} status 状态代码
 * @apiSuccess {String} msg 反馈信息
 * @apiSuccess {Number} label_id 标签编号
 * @apiSuccessExample {json} 成功返回示例
 * HTTP/1.1 200 OK
 * {
 *     "status": 8400,
 *     "msg": "标签创建成功",
 *     "label_id": 12
 * }
 */
router.post('/submit', validate.validateTeacher, function (req, res) {
  Label.create({
    name: req.body.label_name,
    category: req.body.category,
    adder_id: req.body.school_id
  })
    .then(function (label) {
      res.json({
        status: statusLib.LABEL_CREATE_SUCCESSFUL.status,
        msg: statusLib.LABEL_CREATE_SUCCESSFUL.msg,
        label_id: label.label_id
      });
      console.log('label create successful');
    })
    .catch(function (e) {
      console.error(e);
      res.json(statusLib.LABEL_CREATE_FAILED);
      console.log('label create failed');
    });
});

/**
 *
 * 修改标签
 *
 * @api {post} /api/label/mod label.mod
 * @apiName labelMod
 * @apiGroup Label
 * @apiVersion 0.3.3
 * @apiPermission user.teacher
 *
 * @apiDescription 教师修改类型标签。
 *
 * @apiParam {String} type 标签类型 可选： blog|file
 * @apiParam {String} id 信息标识
 * @apiParam {String} labels 新标签列表
 *
 * @apiParamExample {json} 请求示例
 * {
 *     "type": "file",
 *     "id": "fila507d7",
 *     "labels": "4,5,2"
 * }
 *
 * @apiSuccess {Number} status 状态代码
 * @apiSuccess {String} msg 反馈信息
 * @apiSuccessExample {json} 成功返回示例
 * HTTP/1.1 200 OK
 * {
 *     "status": 8500,
 *     "msg": "标签修改成功",
 * }
 */
router.post('/mod', validate.validateTeacher, function (req, res) {
  let database = req.body.type === 'blog'
    ? db.Blog : db.File;

  let where = req.body.type === 'blog'
    ? {blog_id: req.body.id} : {file_id: req.body.id};

  database.update({
    labels: `,${req.body.labels},`
  }, {
    where: where
  })
    .then(function () {
      moment.labelsMod(req.body.labels, req.body.id);
      res.json(statusLib.LABEL_MOD_SUCCESSFUL);
      console.log('labels modified');
    })
    .catch(function (e) {
      console.log(e);
      res.json(statusLib.CONNECTION_ERROR);
    });
});

/**
 *
 * 修改标签名
 *
 * @api {post} /api/label/modname label.mod
 * @apiName labelModName
 * @apiGroup Label
 * @apiVersion 0.4.1
 * @apiPermission user.teacher
 *
 * @apiDescription 教师修改标签名称。
 *
 * @apiParam {Number} label_id 标签类型
 * @apiParam {String} labels 新标签列表
 *
 * @apiParamExample {json} 请求示例
 * {
 *     "label_id": 4,
 *     "label_name": "test"
 * }
 *
 * @apiSuccess {Number} status 状态代码
 * @apiSuccess {String} msg 反馈信息
 * @apiSuccessExample {json} 成功返回示例
 * HTTP/1.1 200 OK
 * {
 *     "status": 8500,
 *     "msg": "标签修改成功"
 * }
 */
router.post('/modname', validate.validateTeacher, function (req, res) {
  Label.update({
    name: req.body.label_name
  }, {
    where: {
      label_id: req.body.label_id
    }
  })
    .then(function () {
      res.json(statusLib.LABEL_MOD_SUCCESSFUL);
      console.log('label name modified');
    })
    .catch(function (e) {
      console.log(e);
      res.json(statusLib.CONNECTION_ERROR);
    });
});

module.exports = router;
