const express = require('express');
const router = express.Router();

const validate = require('../middlewares/validate');
const path = require('../app_paths');
const timeFormat = require('../middlewares/time_format');
const uid = require('../middlewares/id_gen');

const db = require('../models/db_global');
const statusLib = require('../libs/status');

const moment = require('../middlewares/moment');

const planExport = require('../middlewares/plan_export');

const Plan = db.Plan;
const Class = db.Class;
const fs = require('fs');

/**
 *
 * 提交计划
 *
 * @api {post} /api/plan/submit plan.submit
 * @apiName planSubmit
 * @apiGroup Plan
 * @apiVersion 0.3.2
 * @apiPermission user.student
 *
 * @apiDescription 学生提交计划。
 *
 * @apiParam {String} year 学年
 * @apiParam {String} term 学期
 * @apiParam {String} content 计划内容
 * @apiParam {String} start 开始时间
 * @apiParam {String} deadline 结束时间
 *
 * @apiParamExample {json} 请求示例
 * {
 *     "year": "2017-2018",
 *     "term": "1",
 *     "content": "创新实践平台开发",
 *     "start": "2017-10-11",
 *     "deadline": "2017-12-29"
 * }
 *
 * @apiSuccess {Number} status 状态代码
 * @apiSuccess {String} msg 反馈信息
 * @apiSuccess {String} plan_id 计划编号
 * @apiSuccessExample {json} 成功返回示例
 * HTTP/1.1 200 OK
 * {
 *     "status": 5000,
 *     "msg": "计划提交成功",
 *     "plan_id": "pln9c43dc"
 * }
 */
router.post('/submit', validate.validateUser, function (req, res) {
  // a student create a plan
  const {
    year,
    term,
    content,
    start,
    deadline
  } = req.body;

  const status = '未审核';
  const planId = 'pln' + uid.generate();

  let extras = {
    start: start,
    deadline: deadline,
    status: status
  };

  Plan.create({
    plan_id: planId,
    year: year,
    term: term,
    content: content,
    start: start,
    deadline: deadline,
    student_id: req.body.school_id,
    status: status,
    class_id: req.body.class_id
  }).then(function () {
    // if plan is not validated,
    // params[2] should be plan_id, otherwise it should be ''.
    moment.createMoment(
      'planmod',
      content,
      extras,
      req.body.school_id,
      planId
    );
    res.json({
      'status': statusLib.PLAN_SUBMIT_SUCCESSFUL.status,
      'msg': statusLib.PLAN_SUBMIT_SUCCESSFUL.msg,
      'plan_id': planId
    });
    console.log('plan submit successful');
  }).catch(function (e) {
    console.error(e);
    res.json(statusLib.PLAN_SUBMIT_FAILED);
    console.log('plan submit failed');
  });
});

/**
 *
 * 修改计划
 *
 * @api {post} /api/plan/modify plan.modify
 * @apiName planModify
 * @apiGroup Plan
 * @apiVersion 0.3.2
 * @apiPermission user.student
 *
 * @apiDescription 学生修改计划。
 *
 * @apiParam {Number} student_id 用户编号
 * @apiParam {String} year 学年
 * @apiParam {String} term 学期
 * @apiParam {String} content 计划内容
 * @apiParam {String} start 文章编号
 * @apiParam {String} deadline 文章编号
 * @apiParam {String} plan_id 计划编号
 *
 * @apiParamExample {json} 请求示例
 * {
 *     "student_id": 14051531,
 *     "year": "2017-2018",
 *     "term": "1",
 *     "content": "创新实践平台开发V2.0.0",
 *     "start": "2018-01-04",
 *     "deadline": "2018-01-19",
 *     "plan_id": "pln9c43dc"
 * }
 *
 * @apiSuccess {Number} status 状态代码
 * @apiSuccess {String} msg 反馈信息
 * @apiSuccessExample {json} 成功返回示例
 * HTTP/1.1 200 OK
 * {
 *     "status": 5100,
 *     "msg": "计划修改成功"
 * }
 */
router.post('/modify', validate.validateUser, function (req, res, next) {
  // check plan status before modification
  Plan.findOne({
    where: {
      plan_id: req.body.plan_id
    }
  }).then(function (plan) {
    if (plan.dataValues.status !== '已通过') {
      next();
    } else {
      res.json(statusLib.PLAN_MOD_FAILED);
      console.log('plan modify failed');
    }
  }).catch(function (e) {
    console.error(e);
    res.json(statusLib.PLAN_MOD_FAILED);
    console.log('plan modify failed');
  });
});

router.post('/modify', function (req, res) {
  // a student modifies a plan
  const {
    year,
    term,
    content,
    start,
    deadline
  } = req.body;

  const status = '未审核';

  const modData = {
    year: year,
    term: term,
    content: content,
    start: start,
    deadline: deadline,
    student_id: req.body.school_id,
    status: status
  };

  let extras = {
    start: start,
    deadline: deadline,
    status: status
  };

  Plan.update(modData, {
    where: {
      plan_id: req.body.plan_id
    }
  }).then(function () {
    moment.createPlanModifyMoment(
      'planmod',
      content,
      extras,
      req.body.school_id,
      req.body.plan_id
    );
    res.json(statusLib.PLAN_MOD_SUCCESSFUL);
    console.log('plan modify successful');
  }).catch(function (e) {
    console.error(e);
    res.json(statusLib.PLAN_MOD_FAILED);
    console.log('plan modify failed');
  });
});

/**
 *
 * （教师）审核计划
 *
 * @api {post} /api/plan/op plan.op
 * @apiName planOp
 * @apiGroup Plan
 * @apiVersion 0.3.2
 * @apiPermission user.teacher
 *
 * @apiDescription 教师审核学生计划。
 *
 * @apiParam {String} plan_id 计划编号
 * @apiParam {Number} op 操作：0 不通过；1 通过
 *
 * @apiParamExample {json} 请求示例
 * {
 *     "plan_id": "pln9c43dc"，
 *     "op": 1
 * }
 *
 * @apiSuccess {Number} status 状态代码
 * @apiSuccess {String} msg 反馈信息
 * @apiSuccessExample {json} 成功返回示例
 * HTTP/1.1 200 OK
 * {
 *     "status": 5200,
 *     "msg": "计划审核成功"
 * }
 */
router.post('/op', validate.validateTeacher, function (req, res, next) {
  // teacher changes plan status

  Plan.findOne({
    where: {
      plan_id: req.body.plan_id
    }
  }).then(function (plan) {
    if (!plan) {
      console.log('plan verify failed');
      return res.json(statusLib.PLAN_VERIFY_FAILED);
    } else {
      Class.findOne({
        where: {
          class_id: plan.dataValues.class_id
        }
      })
        .then(function (classData) {
          if(classData.dataValues.teacher_id !== req.body.school_id) {
            console.log('plan verify failed');
            return res.json(statusLib.PLAN_VERIFY_FAILED);
          } else {
            next();
          }
        })
        .catch(function (e) {
          console.error(e);
          res.json(statusLib.CONNECTION_ERROR);
          console.log('plan verify failed');
        });
    }
  }).catch(function (e) {
    console.error(e);
    res.json(statusLib.CONNECTION_ERROR);
    console.log('plan verify failed');
  });
});

router.post('/op', function (req, res) {
  // teacher changes plan status
  const status = req.body.op ? '已通过' : '未通过';

  Plan.update({
    status: status
  }, {
    where: {
      plan_id: req.body.plan_id
    }
  }).then(function () {
    moment.validatePlanMoment(req.body.plan_id, status);
    res.json(statusLib.PLAN_VERIFY_SUCCESSFUL);
    console.log('plan verified');
  }).catch(function (e) {
    console.error(e);
    res.json(statusLib.PLAN_VERIFY_FAILED);
    console.log('plan verify failed');
  });
});

/**
 *
 * 查询计划
 *
 * @api {post} /api/plan/query plan.query
 * @apiName planQuery
 * @apiGroup Plan
 * @apiVersion 0.1.0
 * @apiPermission user
 *
 * @apiDescription 获取学生计划列表。
 *
 * @apiParam request 查询条件："all"|"sid"
 *
 * @apiParamExample {json} 请求示例1
 * {
 *     "request": "all"
 * }
 * @apiParamExample {json} 请求示例2
 * {
 *     "request": "sid"
 * }
 *
 * @apiSuccess {Array} data 计划列表
 * @apiSuccessExample {json} 成功返回示例
 * HTTP/1.1 200 OK
 * [
 *     {
 *         "plan_id": "pln9c43dc",
 *         "year": "2017-2018",
 *         "term": "1",
 *         "content": "创新实践平台开发V2.0.0",
 *         "start": "2018-01-04",
 *         "deadline": "2018-01-19",
 *         "status": "未审核",
 *         "class_id": "(2017-2018-1)-S0500560-40429-2",
 *         "created_at": "2018-01-30T05:50:22.000Z",
 *         "updated_at": "2018-01-30T05:53:44.000Z",
 *         "student_id": 14051531,
 *         "submitTime": "2018-01-30 13:50:22"
 *     },
 *     {
 *         "plan_id": "plnf1d5c4",
 *         "year": "2017-2018",
 *         "term": "1",
 *         "content": "test0",
 *         "start":"2018-01-26",
 *         "deadline": "2018-01-27",
 *         "status": "已通过",
 *         "class_id": "(2017-2018-1)-S0500560-40429-2",
 *         "created_at": "2018-01-25T17:15:25.000Z",
 *         "updated_at": "2018-01-25T17:16:33.000Z",
 *         "student_id": 14051531,
 *         "submitTime": "2018-01-26 01:15:25"
 *     }
 * ]
 */
router.post('/query', validate.validateUser, function (req, res) {
  const request = req.body.request;
  const where = (request === 'all') ? {} : {student_id: req.body.school_id};

  Plan.findAll({
    where: where,
    order: [
      ['created_at', 'DESC']
    ]
  }).then(function (plans) {
    for (let i = 0; i < plans.length; i++) {
      plans[i].dataValues.submitTime = timeFormat(
        plans[i].dataValues.created_at);
    }
    res.json({
      plans: plans,
      cur_class: req.body.class_id
    });
    console.log('plan query successful');
  }).catch(function (e) {
    console.error(e);
    res.json(statusLib.PLAN_QUERY_FAILED);
    console.log('plan query failed');
  });
});

/**
 *
 * 导出计划为Word文档
 *
 * @api {post} /api/plan/export plan.export
 * @apiName planExport
 * @apiGroup Plan
 * @apiVersion 0.4.2
 * @apiPermission user.teacher
 *
 * @apiDescription 教师导出学生个人计划表。
 * 当只提供班级号时，导出整个班级的计划存档。
 * 当只提供学生学号时，导出该学生所有学期当课程记录存档。
 *
 * @apiParam {Number} [student_id] 学生学号
 * @apiParam {String} cur_class 当前选课号 若无学生学号则必填
 *
 * @apiParamExample {json} 请求示例
 * {
 *     "student_id": 14051531
 *     "cur_class": "(2017-2018-1)-S0500560-40429-2"
 * }
 *
 * @apiSuccess {Number} status 状态代码
 * @apiSuccess {String} msg 反馈信息
 * @apiSuccess {String} path 生成包含学生个人计划信息的Word文档的链接信息
 * @apiSuccessExample {json} 成功返回示例
 * HTTP/1.1 200 OK
 * {
 *     "status": 5500,
 *     "msg": "计划导出成功",
 *     "path": "/api/download?plans=plan_export_14051531_1517480499563.docx"
 * }
 */
router.post('/export', validate.validateTeacher, function (req, res, next) {
  const removeDirContents = function (fileUrl) {
    let files = fs.readdirSync(fileUrl);
    files.forEach(function (file) {
      fs.unlinkSync(fileUrl + '/' + file);
    });
  };
  removeDirContents(path.exportDir);
  removeDirContents(path.plans);
  next();
});

router.post('/export', function (req, res, next) {
  if (req.body.student_id) {
    planExport.exportPlansByStudent(req.body.student_id, req.body.cur_class,
      function (err, fileName) {
        if (err) {
          res.json(statusLib.PLAN_EXPORT_FAILED);
          console.log('single student plan export error');
        } else {
          res.json({
            status: statusLib.PLAN_EXPORT_SUCCESSFUL.status,
            msg: statusLib.PLAN_EXPORT_SUCCESSFUL.msg,
            path: '/api/download?plans=' + fileName
          });
        }
      });
  } else {
    planExport.exportPlansByClass(req.body.cur_class, function (err, fileName) {
      if (err) {
        res.json(statusLib.PLAN_EXPORT_FAILED);
        console.log('class students plan export error');
      } else {
        res.json({
          status: statusLib.PLAN_EXPORT_SUCCESSFUL.status,
          msg: statusLib.PLAN_EXPORT_SUCCESSFUL.msg,
          path: '/api/download?finals=' + fileName
        });
      }
    });
  }
});

module.exports = router;
