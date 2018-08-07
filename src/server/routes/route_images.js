const express = require('express');
const router = express.Router();

const validate = require('../middlewares/validate');

const db = require('../models/db_global');
const statusLib = require('../libs/status');

const uid = require('../middlewares/id_gen');
const moment = require('../middlewares/moment');
const Blog = db.Blog;
const Image = db.Image;

const path = require('../app_paths');
const pathLib = require('path');

const fs = require('fs');
const multer = require('multer');

const gm = require('gm').subClass({graphicsMagick: true});

let objMulter = multer({
  dest: pathLib.join(path.blogs, '__temp__')
});

/**
 *
 * 上传文章图片（用在发表文章中）
 *
 * @api {post} /api/image/upload image.upload
 * @apiName imageUpload
 * @apiGroup Image
 * @apiVersion 0.3.7
 * @apiPermission user
 *
 * @apiDescription 用户上传文章中的图片。
 *
 * @apiParam {String} blog_id 图片所属文章编号
 * @apiParam {String} type 图片所属文章类型
 * @apiParam {file} image 图片文件
 * @apiParamExample {formdata} 请求示例
 * {
 *     "blog_id": "blg259942",
 *     "type": "event",
 *     "./0": <0.jpg>,
 *     "./1": <1.jpg>,
 *     "./2": <2.jpg>,
 *     "./3": <3.jpg>
 * }
 *
 * @apiSuccess / 默认成功无返回
 */
router.post('/upload', objMulter.any(), validate.validateUser, function (req, res, next) {
  // upload images for an article
  let folderName = req.body.blog_id;
  let dir = pathLib.join(path.blogs, folderName);
  let imgArr = [];
  let addImage = function (url, width, height) {
    Image.create({
      image_id: 'img' + uid.generate(),
      src: url,
      width: width,
      height: height,
      blog_id: req.body.blog_id,
      uploader_id: req.body.uploader_id
    })
      .catch(function (e) {
        console.error(e);
      });
  };
  let addCover = function (url) {
    moment.addCoverToArticleMoment(req.body.blog_id, url);
    Blog.update({
      cover: url
    }, {
      where: {
        blog_id: req.body.blog_id
      }
    })
      .then(function () {
        console.log('cover added');
      })
      .catch(function (e) {
        console.log(e);
      });
  };

  fs.mkdir(dir, function (err) {
    if (err) {
      console.log(err);
    } else {
      console.log(dir + ' created.');
      fs.mkdirSync(pathLib.join(dir, 'thumbs'));
      console.log(dir + '/thumb created.');
      let flag = 0;

      for (let i = 0; i < req.files.length; i++) {
        // for each file uploaded
        let newFilename = req.files[i].filename + pathLib.parse(req.files[i].originalname).ext;
        let newDir = pathLib.join(dir, newFilename);
        let coverDir = pathLib.join(dir, 'thumbs', newFilename);
        let newUrl = path.host + '/images/blogs/' + folderName + '/' + newFilename;
        let coverUrl = path.host + '/images/blogs/' + folderName + '/thumbs/' + newFilename;

        gm(req.files[i].path)
          .size(function (err, size) {
            if (!err) {
              let width = size.width;
              let height = size.height;
              let standard = 1280;
              let ratio = height * 1.0 / width;
              if (ratio < 1) {
                addImage(newUrl, standard, standard * ratio);
              } else {
                addImage(newUrl, standard / ratio, standard);
              }
            }
          })
          .resize(1280, 1280)
          .quality(75)
          .write(newDir, function (err) {
            if (err) {
              console.log(err);
              next();
            } else {
              console.log('image compression completed');
              gm(newDir)
                .resize(360, 360)
                .quality(50)
                .write(coverDir, function (err) {
                  if (err) {
                    console.log(err);
                    next();
                  } else {
                    console.log('thumb image created');
                    if (i === 0) {
                      addCover(coverUrl);
                    }
                    if (req.body.type !== 'event') {
                      imgArr.push([req.files[i].fieldname, newUrl]);
                    }
                    flag++;
                    fs.unlinkSync(req.files[i].path);
                    if (flag > req.files.length - 1) {
                      if (req.body.type !== 'event') {
                        req.imgArr = imgArr;
                        next();
                      } else {
                        res.json(statusLib.BLOG_PUB_SUCCESSFUL);
                      }
                    }
                  }
                });
            }
          });
      }
    }
  });
});

router.post('/upload', function (req, res) {
  if (req.body.type === 'event') {
    res.json(statusLib.BLOG_PUB_SUCCESSFUL);
  } else {
    let correctImgUrl = function (content, imgArr) {
      let contentCorrected = content;
      for (let i = 0; i < imgArr.length; i++) {
        let reg = new RegExp(`\\\(\\${imgArr[i][0]}\\\)`, 'g');
        contentCorrected = contentCorrected.replace(reg, `(${imgArr[i][1]})`);
      }
      return contentCorrected;
    };
    Blog.findByPrimary(req.body.blog_id)
      .then(function (profile) {
        Blog.update({
          content: correctImgUrl(profile.content, req.imgArr)
        }, {
          where: {
            blog_id: req.body.blog_id
          }
        })
          .then(function () {
            res.json(statusLib.BLOG_PUB_SUCCESSFUL);
          })
          .catch(function (e) {
            console.log(e);
            res.json(statusLib.PLAN_EXPORT_FAILED);
          });
      })
      .catch(function (e) {
        console.log(e);
        res.json(statusLib.PLAN_EXPORT_FAILED);
      });
  }
});

module.exports = router;
