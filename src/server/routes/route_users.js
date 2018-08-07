const express = require('express');
const router = express.Router();

const jwt = require('jwt-simple');
const tokenLib = require('config-lite')(__dirname).token;
const validate = require('../middlewares/validate');

const pwdLib = require('../middlewares/password');
const fs = require('fs');
const multer = require('multer');
const pathLib = require('path');
const path = require('../app_paths');
const xl = require('node-xlrd');

const sequelize = require('sequelize');
const db = require('../models/db_global');
const statusLib = require('../libs/status');
const uid = require('../middlewares/id_gen');

const User = db.User;
const Profile = db.Profile;
const Class = db.Class;
const Final = db.Final;

let objMulter = multer({
  dest: path.userinfo
});

/**
 *
 * 学生用户解析
 *
 * @api {post} /api/user/parse user.parse
 * @apiName userParse
 * @apiGroup User
 * @apiVersion 0.4.2
 * @apiPermission user.teacher
 *
 * @apiDescription 学生用户解析。
 * 上传一个给定格式的Excel表格，返回解析的学生用户注册信息，含用户名和初始密码。
 * 表格上传方式为form-data。
 *
 * @apiParam {File} excel 指定电子表格
 *
 * @apiParamExample {formdata} 请求示例
 * {
 *     "file": <教学班点名册.xls>
 * }
 *
 * @apiSuccess {Number} status 状态代码
 * @apiSuccess {String} msg 反馈信息
 * @apiSuccess {Object} classData 班级信息
 * @apiSuccess {Array} userArr 待注册学生用户信息
 * @apiSuccessExample {json} 成功返回示例
 * HTTP/1.1 200 OK
 * {
 *     "status": 1300,
 *     "msg": "学生信息解析成功",
 *     "classData": {
 *         "year": "2017-2018",
 *         "term": "1",
 *         "class_id": "(2017-2018-1)-S0500560-40429-2",
 *         "cname": "创新综合实践",
 *         "time": "周六第6,7节{第1-17周};周六第8,9节{第1-17周}",
 *         "loc": "第1教研楼608;第1教研楼608",
 *         "status": "active",
 *         "teacher_id": 40429
 *     },
 *     "userArr": [
 *         {
 *             "username": "14051531",
 *             "password": "14051531",
 *             "name": "章梓航",
 *             "school_id": 14051531,
 *             "class_id": 14052313,
 *             "grade": "2014",
 *             "cur_class": "(2017-2018-1)-S0500560-40429-2",
 *             "supervisor": "邬惠峰"
 *         },
 *         {
 *             "username": "14051309",
 *             "password": "14051309",
 *             "name": "陈钧博",
 *             "school_id": 14051309,
 *             "class_id": 14052312,
 *             "grade": "2014",
 *             "cur_class": "(2017-2018-1)-S0500560-40429-2",
 *             "supervisor": "邬惠峰"
 *         }
 *     ]
 * }
 */
router.post('/parse', validate.validateTeacher, function (req, res, next) {
  let files = fs.readdirSync(path.userinfo);
  files.forEach(function (file) {
    fs.unlinkSync(path.userinfo + '/' + file);
  });
  next();
});

router.post('/parse', objMulter.any(), function (req, res, next) {
  // XLS file upload
  // rename a file
  let newName = req.files[0].path +
    pathLib.parse(req.files[0].originalname).ext;
  fs.rename(req.files[0].path, newName, function (err) {
    if (err) {
      console.log('file rename error');
      return res.json(statusLib.FILE_RENAME_FAILED);
    } else { // parse XLS file
      req.fileURL = newName;
      next();
    }
  });
});

router.post('/parse', function (req, res, next) {
  // extract user data & convert to JS object
  xl.open(req.fileURL, function (err, data) {
    if (err) {
      console.log(err);
      res.json(statusLib.USERINFO_IMPORT_FAILED);
    } else {
      let sheet = data.sheets[0];
      // check if xls is suitable for parsing
      if (sheet.cell(0, 0) !== '教学班点名册' ||
        !sheet.cell(1, 1) ||
        !sheet.cell(1, 4) ||
        !sheet.cell(1, 6) ||
        !sheet.cell(1, 13) ||
        !sheet.cell(2, 9) ||
        !sheet.cell(2, 13) ||
        !sheet.cell(4, 0)) {
        console.log('xls is not suitable for parsing or is empty');
        return res.json(statusLib.USERINFO_PARSE_FAILED_NOT_SUITABLE);
      } else {
        Class.findOne({
          where: {
            class_id: sheet.cell(1, 6)
          }
        })
          .then(function (classData) {
            if (classData === null) {
              req.body.sheet = sheet;
              next();
            } else {
              console.log('duplicated class info');
              res.json(statusLib.USERINFO_PARSE_FAILED_DUP_CLASS_INFO);
            }
          })
          .catch(function (e) {
            console.error(e);
            res.json(statusLib.USERINFO_IMPORT_FAILED);
            console.log('validate failed');
          });
      }
    }
  });
});

router.post('/parse', function (req, res) {
  const sheet = req.body.sheet;

  // parse class info
  let classData = {
    year: sheet.cell(1, 1),
    term: sheet.cell(1, 4),
    class_id: sheet.cell(1, 6),
    cname: sheet.cell(1, 13),
    time: sheet.cell(2, 9),
    loc: sheet.cell(2, 13),
    status: 'active',
    teacher_id: Number(sheet.cell(1, 6).split('-')[4])
  };

  let newClass = {
    term: `${classData.year}-${classData.term}`,
    cname: classData.cname,
    cid: classData.class_id
  };

  // parse student info
  let userArr = [];
  for (let rIdx = 4; rIdx < sheet.row.count; rIdx++) {
    try {
      userArr.push({
        username: sheet.cell(rIdx, 0),
        password: sheet.cell(rIdx, 0),
        name: sheet.cell(rIdx, 2),
        school_id: parseInt(sheet.cell(rIdx, 0)),
        class_id: parseInt(sheet.cell(rIdx, 4)),
        grade: 20 + sheet.cell(rIdx, 0)[0] + sheet.cell(rIdx, 0)[1],
        cur_class: sheet.cell(1, 6),
        new_class: JSON.stringify(newClass),
        supervisor: sheet.cell(2, 1)
      });
    } catch (e) {
      console.log(e);
    }
  }
  res.json({
    status: statusLib.USERINFO_PARSE_SUCCESSFUL.status,
    msg: statusLib.USERINFO_PARSE_SUCCESSFUL.msg,
    classData: classData,
    userArr: userArr
  });
});

/**
 *
 * 学生用户导入
 *
 * @api {post} /api/user/import user.import
 * @apiName userImport
 * @apiGroup User
 * @apiVersion 0.5.2
 * @apiPermission user.teacher
 *
 * @apiDescription 学生用户导入。
 * 将 User - parse 接口获得的用户信息确认后进行批量注册，同时将班级信息也存入数据库。
 *
 * @apiParam {Number} teacher_id 指定电子表格
 * @apiParam {Object} classData 班级信息
 * @apiParam {Array} userArr 待注册学生用户信息
 *
 * @apiParamExample {json} 请求示例
 * {
 *     "classData": {
 *         "year": "2017-2018",
 *         "term": "1",
 *         "class_id": "(2017-2018-1)-S0500560-40429-2",
 *         "cname": "创新综合实践",
 *         "time": "周六第6,7节{第1-17周};周六第8,9节{第1-17周}",
 *         "loc": "第1教研楼608;第1教研楼608",
 *         "status": "active",
 *         "teacher_id": 40429
 *     },
 *     "userArr": [
 *         {
 *             "username": "14051531",
 *             "password": "14051531",
 *             "name": "章梓航",
 *             "school_id": 14051531,
 *             "class_id": 14052313,
 *             "grade": "2014",
 *             "cur_class": "(2017-2018-1)-S0500566-40429-2",
 *             "supervisor": "邬惠峰"
 *         },
 *         {
 *             "username": "14051309",
 *             "password": "14051309",
 *             "name": "陈钧博",
 *             "school_id": 14051309,
 *             "class_id": 14052312,
 *             "grade": "2014",
 *             "cur_class": "(2017-2018-1)-S0500566-40429-2",
 *             "supervisor": "邬惠峰"
 *         }
 *     ]
 * }
 *
 * @apiSuccess {Number} status 状态代码
 * @apiSuccess {String} msg 反馈信息
 *
 * @apiSuccessExample {json} 成功返回示例
 * HTTP/1.1 200 OK
 * {
 *     "status": 1400,
 *     "msg": "学生信息导入成功"
 * }
 */
router.post('/import', validate.validateTeacher, function (req, res, next) {
  // import data
  const classData = req.body.classData;
  Class.create(classData)
    .then(function () {
      next();
    })
    .catch(function (e) {
      console.error(e);
      res.json(statusLib.USERINFO_IMPORT_FAILED);
      console.log('class import failed');
    });
});

router.post('/import', function (req, res) {
  // create record in table `user` & `profile`
  const users = req.body.userArr;
  const identity = 'student';
  const academy = '计算机学院';
  let flag = 0; // flag of all users imported

  function createUser (userIdx) {
    User.findOne({ // check record to ensure no duplication
      where: {
        username: users[userIdx].username
      }
    })
      .then(function (user) {
        if (user !== null) { // user exists
          console.log('user already exists');
          Profile.findOne({ // get previous prev_classes data
            where: {
              school_id: users[userIdx].school_id
            }
          })
            .then(function (profile) {
              let newClass = users[userIdx].new_class;
              let newPrevClasses = JSON.parse(profile.prev_classes);
              newPrevClasses.data.push(newClass);
              Profile.update({
                cur_class: users[userIdx].cur_class,
                prev_classes: JSON.stringify(newPrevClasses)
              }, {
                where: {
                  school_id: users[userIdx].school_id
                }
              })
                .then(function () {
                  Final.create({
                    cswk_id: 'cwk' + uid.generate(),
                    class_id: users[userIdx].cur_class,
                    student_id: users[userIdx].school_id
                  })
                    .then(function () {
                      console.log('cswk record created');
                    });
                  flag++;
                  if (flag === users.length) {
                    console.log('all users modified');
                    res.json(statusLib.USERINFO_IMPORT_SUCCESSFUL);
                  }
                })
                .catch(function (e) {
                  console.error(e);
                  return res.json(statusLib.USERINFO_IMPORT_FAILED);
                });
            });
        } else {
          User.create({ // first: create a User record
            username: users[userIdx].username,
            password: pwdLib.convert(users[userIdx].password),
            identity: identity
          })
            .then(function (user) {
              let prevClasses = JSON.stringify({
                data: [users[userIdx].new_class]
              });
              Profile.create({
                school_id: users[userIdx].school_id,
                avatar: '',
                name: users[userIdx].name,
                academy: academy,
                class_id: users[userIdx].class_id,
                grade: users[userIdx].grade,
                cur_class: users[userIdx].cur_class,
                prev_classes: prevClasses,
                supervisor: users[userIdx].supervisor,
                user_id: user.id
              }).then(function () {
                // create a final course-work record for a student
                Final.create({
                  cswk_id: 'cwk' + uid.generate(),
                  class_id: users[userIdx].cur_class,
                  student_id: users[userIdx].school_id
                })
                  .then(function () {
                    console.log('cswk record created');
                  });
                flag++;
                if (flag === users.length) {
                  console.log('all users imported');
                  res.json(statusLib.USERINFO_IMPORT_SUCCESSFUL);
                }
              })
                .catch(function (e) {
                  console.error(e);
                  return res.json(statusLib.USERINFO_IMPORT_FAILED);
                });
            })
            .catch(function (e) {
              console.error(e);
              return res.json(statusLib.USERINFO_IMPORT_FAILED);
            });
        }
      })
      .catch(function (e) {
        console.error(e);
        return res.json(statusLib.USERINFO_IMPORT_FAILED);
      });
  }

  for (let userIdx = 0; userIdx < users.length; userIdx++) {
    createUser(userIdx);
  }
});

/**
 *
 * 用户登录
 *
 * @api {post} /api/user/login user.login
 * @apiName userLogin
 * @apiGroup User
 * @apiVersion 0.4.0
 * @apiPermission all
 *
 * @apiDescription 用户登入系统。使用token验证。
 *
 * @apiParam {String} username 用户名（学号/工号）
 * @apiParam {String} password （经过摘要后的）密码
 *
 * @apiParamExample {json} 请求示例
 * {
 *     "username": "14051531",
 *     "password": "34e098c24add8f2c77e23eb2906c007c6a6c5fa7"
 * }
 *
 * @apiSuccess {Number} status 状态代码
 * @apiSuccess {String} msg 反馈信息
 *
 * @apiSuccessExample {json} 成功返回示例
 * HTTP/1.1 200 OK
 * {
 *     "status": 1100,
 *     "msg": "登录成功"
 * }
 */
router.post('/login', function (req, res) {
  const {username, password} = req.body;

  User.findOne({
    where: {
      username: username
    },
    include: [
      {
        model: Profile,
        where: {
          user_id: sequelize.col('user.id')
        },
        attributes: ['school_id', 'name', 'cur_class']
      }]
  })
    .then(function (user) {
      if (!user) {
        res.json(statusLib.INVALID_USERNAME);
        console.log('user does not exist');
      } else if (user.dataValues.password === pwdLib.convert(password)) {
        let payload = {
          id: user.id,
          uname: user.username,
          type: user.identity,
          sid: parseInt(user.username),
          name: user.profile.name,
          cid: user.profile.cur_class,
          exp: Date.now() + tokenLib.exp
        };
        let token = jwt.encode(payload, tokenLib.secret);
        res.header('X-Accept-Token', token);
        res.cookie('token', token, {
          maxAge: 3600 * 24 * 3 * 1000
        });
        console.log('log in successful');
        res.json(statusLib.LOGIN_SUCCESSFUL);
      } else {
        res.json(statusLib.PASSWORD_CHECK_FAILED);
        console.log('password wrong');
      }
    })
    .catch(function (e) {
      console.error(e);
      res.json(statusLib.CONNECTION_ERROR);
    });
});

/**
 *
 * 解析用户token
 *
 * @api {get} /api/user/token user.token
 * @apiName userToken
 * @apiGroup User
 * @apiVersion 0.3.6
 * @apiPermission user
 *
 * @apiDescription 通过cookie发送token获取用户信息
 *
 * @apiParamExample {json} 请求示例
 * /api/user/token
 *
 * @apiSuccess {Object} user
 * @apiSuccessExample {json} 成功返回示例
 * HTTP/1.1 200 OK
 * {
 *     "username": "14051531",
 *     "identity": "student",
 *     "school_id": 14051531,
 *     "name": "章梓航",
 *     "cur_class": "(2017-2018-1)-S0500566-40429-2"
 * }
 */
router.get('/token', function (req, res) {
  const token = req.cookies['token'] || '';
  if (token !== '') {
    let payload = jwt.decode(token, tokenLib.secret);
    if (payload.exp && Date.now() < payload.exp) {
      res.json({
        username: payload.uname,
        identity: payload.type,
        school_id: payload.sid,
        name: payload.name,
        cur_class: payload.cid
      });
    } else {
      res.json(statusLib.VALIDATE_FAILED);
    }
  } else {
    res.end();
  }
});

/**
 *
 * 用户登出
 *
 * @api {get} /api/user/logout user.logout
 * @apiName userLogout
 * @apiGroup User
 * @apiVersion 0.3.6
 * @apiPermission user
 *
 * @apiDescription 用户登出系统。使用token验证。
 *
 * @apiParamExample {json} 请求示例
 * /api/user/logout
 *
 * @apiSuccess {Number} status 状态代码
 * @apiSuccess {String} msg 反馈信息
 * @apiSuccessExample {json} 成功返回示例
 * HTTP/1.1 200 OK
 * {
 *     "status": 1200,
 *     "msg": "已退出登录"
 * }
 */
router.get('/logout', validate.validateUser, function (req, res) {
  res.clearCookie('token');
  res.json(statusLib.LOGGED_OUT);
  console.log('logged out');
});

/**
 *
 * 用户修改密码
 *
 * @api {post} /api/user/pwdmod user.pwdmod
 * @apiName userPwdMod
 * @apiGroup User
 * @apiVersion 0.4.0
 * @apiPermission user
 *
 * @apiDescription 用户修改密码。
 *
 * @apiParam {String} username 用户名（学号/工号）
 * @apiParam {String} password 当前密码（摘要后）
 * @apiParam {String} newPassword 新密码（摘要后）
 *
 * @apiParamExample {json} 请求示例
 * {
 *     "username": "14051531",
 *     "password": "2f58dc2197520b1612df7e3805cac4f944af7ec3ff4c29e388ee9a36891f9e3c"，
 *     "newPassword": "185dea61bc6637938ad8e76d589e20dfd2e3d69e05066c896081aaf2d81d79e2"
 * }
 *
 * @apiSuccess {Number} status 状态代码
 * @apiSuccess {String} msg 反馈信息
 * @apiSuccessExample {json} 成功返回示例
 * HTTP/1.1 200 OK
 * {
 *     "status": 1500,
 *     "msg": "密码修改成功"
 * }
 */
router.post('/pwdmod', validate.validateUser, function (req, res, next) {
  const password = req.body.password;
  const newPassword = req.body.new_password;

  if (!password || !newPassword) {
    console.log('data not complete');
    res.json(statusLib.USER_PWD_MOD_FAILED);
  } else {
    User.findOne({
      where: {
        username: req.body.school_id.toString()
      }
    })
      .then(function (user) { // do further check
        if (user.dataValues.password === pwdLib.convert(password)) {
          next();
        } else {
          res.json(statusLib.USER_PWD_MOD_FAILED);
          console.log('password wrong');
        }
      })
      .catch(function (e) {
        console.error(e);
        res.json(statusLib.CONNECTION_ERROR);
      });
  }
});

router.post('/pwdmod', function (req, res) {
  // password checked
  User.update({
    password: req.body.new_password
  }, {
    where: {
      username: req.body.school_id.toString()
    }
  })
    .then(function () {
      console.log('password mod successful');
      res.json(statusLib.USER_PWD_MOD_SUCCESSFUL);
    })
    .catch(function (e) {
      console.error(e);
      res.json(statusLib.CONNECTION_ERROR);
    });
});

module.exports = router;
