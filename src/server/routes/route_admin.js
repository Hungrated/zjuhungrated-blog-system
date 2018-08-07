const express = require('express');
const router = express.Router();

const validate = require('../middlewares/validate');

const pwdLib = require('../middlewares/password');

const db = require('../models/db_global');
const statusLib = require('../libs/status');
const uid = require('../middlewares/id_gen');

const User = db.User;
const Profile = db.Profile;

/**
 *
 * （教师）用户注册
 *
 * @api {post} /api/adminops/reg admin.reg
 * @apiName adminReg
 * @apiGroup Admin
 * @apiVersion 0.5.1
 * @apiPermission administrator
 *
 * @apiDescription 教师用户注册。
 *
 * @apiParam {String} token 口令
 * @apiParam {Number} id 教师工号
 * @apiParam {String} name 教师姓名
 *
 * @apiParamExample {json} 请求示例
 * {
 *     "token": "administrator",
 *     "id": 40429,
 *     "name": "邬惠峰"
 * }
 *
 * @apiSuccess {Number} status 状态代码
 * @apiSuccess {String} msg 反馈信息
 * @apiSuccess {String} name 教师姓名
 * @apiSuccess {String} username 教师用户名
 * @apiSuccess {String} password 初始密码 *
 * @apiSuccessExample {json} 成功返回示例
 * HTTP/1.1 200 OK
 * {
 *     "status": 1000,
 *     "msg": "注册成功",
 *     "name": "邬惠峰",
 *     "username": "40429",
 *     "password": "e67b2b"
 * }
 */
router.post('/reg', validate.validateTeacher, validate.validateAdmin,
  function (req, res, next) {
    // only for teachers, only in backend
    const {id, name} = req.body;
    if (!id || !name) { return res.json(statusLib.REG_FAILED); }

    User.findOne({
      where: {
        username: id.toString()
      }
    }).then(function (user) {
      if (!user) {
        next();
      } else {
        res.json(statusLib.REG_FAILED);
        console.log('teacher reg failed');
      }
    });
  });

router.post('/reg', function (req, res) {
  const {id, name} = req.body;
  const password = uid.generate();
  User.create({
    username: id.toString(),
    password: pwdLib.convert(password),
    identity: 'teacher'
  })
    .then(function (user) {
      Profile.create({
        school_id: id,
        name: name,
        user_id: user.dataValues.id
      })
        .then(function () {
          res.json({
            status: statusLib.REG_SUCCESSFUL.status,
            msg: statusLib.REG_SUCCESSFUL.msg,
            username: id,
            name: name,
            password: password
          });
          console.log('teacher reg successful');
        })
        .catch(function (e) {
          console.error(e);
          res.json(statusLib.CONNECTION_ERROR);
        });
    })
    .catch(function (e) {
      console.error(e);
      res.json(statusLib.CONNECTION_ERROR);
    });
});

/**
 *
 * （教师）用户查询
 *
 * @api {post} /api/adminops/query admin.query
 * @apiName adminQuery
 * @apiGroup Admin
 * @apiVersion 0.5.1
 * @apiPermission administrator
 *
 * @apiDescription 管理员查询教师信息。
 *
 * @apiParam {String} token 口令
 *
 * @apiParamExample {json} 请求示例
 * {
 *     "token": "administrator"
 * }
 *
 * @apiSuccess {Array} list 教师用户列表
 * @apiSuccessExample {json} 成功返回示例
 * HTTP/1.1 200 OK
 * {
 *     "list": [
 *         {
 *             "id": 1,
 *             "username": "40429",
 *             "password": "580953e527a535e67b2b522251f167864dc0b8ec2dfb99e8a87666ad1ccfc524",
 *             "identity": "teacher",
 *             "created_at": "2018-04-10T01:51:00.000Z",
 *             "updated_at": "2018-04-13T05:38:27.000Z",
 *             "profile": {
 *                 "name": "邬惠峰"
 *             }
 *         }
 *     ]
 * }
 */
router.post('/query', validate.validateTeacher, validate.validateAdmin,
  function (req, res) {
    User.findAll({
      where: {
        identity: 'teacher'
      },
      order: [
        ['created_at', 'DESC']
      ],
      include: [
        {
          model: Profile,
          attributes: ['name']
        }]
    })
      .then(function (list) {
        res.json({
          list: list
        });
      })
      .catch(function (e) {
        console.error(e);
        res.json(statusLib.CONNECTION_ERROR);
      });
  }
);

/**
 *
 * （教师）用户重置密码
 *
 * @api {post} /api/adminops/pwdreset admin.pwdreset
 * @apiName adminPwdReset
 * @apiGroup Admin
 * @apiVersion 0.5.1
 * @apiPermission administrator
 *
 * @apiDescription 重置教师密码。
 *
 * @apiParam {String} token 口令
 * @apiParam {String} username 用户名
 *
 * @apiParamExample {json} 请求示例
 * {
 *     "token": "administrator",
 *     "username": 40429
 * }
 *
 * @apiSuccess {Number} status 状态代码
 * @apiSuccess {String} msg 反馈信息
 * @apiSuccess {String} password 重置后的密码
 * @apiSuccessExample {json} 成功返回示例
 * HTTP/1.1 200 OK
 * {
 *     "status": 1500,
 *     "msg": "密码修改成功",
 *     "password": "b9e063"
 * }
 */

router.post('/pwdreset', validate.validateTeacher, validate.validateAdmin,
  function (req, res) {
    const newPassword = uid.generate();
    User.update(
      {
        password: pwdLib.convert(newPassword)
      },
      {
        where: {
          username: req.body.username
        }
      })
      .then(function (list) {
        res.json({
          status: statusLib.USER_PWD_MOD_SUCCESSFUL.status,
          msg: statusLib.USER_PWD_MOD_SUCCESSFUL.msg,
          password: newPassword
        });
      })
      .catch(function (e) {
        console.error(e);
        res.json(statusLib.CONNECTION_ERROR);
      });
  }
);

module.exports = router;
