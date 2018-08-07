const pathLib = require('path');
const path = require('../app_paths');

const timeFormat = require('../middlewares/time_format');
const zipper = require('zip-local');

const db = require('../models/db_global');
const uid = require('./id_gen');

const Profile = db.Profile;
const Plan = db.Plan;
const Meeting = db.Meeting;
const Final = db.Final;

const async = require('async');
const fs = require('fs');
const officeGen = require('officegen');

const createHeader = function (profile) {
  let tableHeadOpts = {
    cellColWidth: 2250,
    b: true,
    vAlign: 'center',
    sz: 20,
    shd: {
      fill: 'DDDDDD'
    },
    fontFamily: 'Times New Roman'
  };

  let tableContentOpts = {
    cellColWidth: 2250,
    vAlign: 'center',
    b: true,
    sz: 20,
    fontFamily: 'Times New Roman'
  };

  let objSubTitle = function (str) {
    return {
      type: 'text',
      val: str,
      opt: {font_face: '黑体', font_size: 12},
      lopt: {align: 'left'}
    };
  };

  let objLine = {
    type: 'horizontalline'
  };

  let objHeader = [{
    type: 'text',
    val: 'header'
  },
    {
      type: 'image',
      path: pathLib.resolve(__dirname, '../public/assets/HDU_LOGO.png'),
      opt: {cx: 150, cy: 50}
    },
    {
      type: 'text',
      // space as blanks
      val: '                                      ' +
      '                                           '
    },
    {
      type: 'image',
      path: pathLib.resolve(__dirname, '../public/assets/innovation_practice.png'),
      opt: {cx: 150, cy: 50}
    }
  ];

  let objTitle = {
    type: 'text',
    val: '创新实践课程个人报告',
    opt: {font_face: '黑体', bold: true, font_size: 22},
    lopt: {align: 'center'}
  };

  let studentProfile = [
    [{
      val: '姓 名',
      opts: tableHeadOpts
    }, {
      val: '学 号',
      opts: tableHeadOpts
    }, {
      val: '导 师',
      opts: tableHeadOpts
    }, {
      val: '年 级',
      opts: tableHeadOpts
    }],
    [{
      val: profile.name,
      opts: tableContentOpts
    }, {
      val: profile.school_id,
      opts: tableContentOpts
    }, {
      val: profile.supervisor,
      opts: tableContentOpts
    }, {
      val: profile.grade,
      opts: tableContentOpts
    }]
  ];

  let studentProfileStyle = {
    tableColWidth: 4261,
    tableSize: 20,
    tableAlign: 'center',
    tableFontFamily: 'Times New Roman',
    borders: true
  };

  let objProfile = {
    type: 'table',
    val: studentProfile,
    opt: studentProfileStyle
  };

  return [
    objHeader,
    objLine,
    objTitle,
    objProfile,
    objSubTitle(''),
  ];
};

const createFooter = function () {
  let curTime = new Date();
  let objFooter = {
    type: 'text',
    val: '导出时间： ' + timeFormat(curTime),
    opt: {font_face: 'Times New Roman', color: 'DDDDDD', bold: true},
    lopt: {align: 'right'}
  };

  return [
    objFooter
  ];
};

const createData = function (planArr, meetingArr, finalArr, cid) {
  let objLine = {
    type: 'horizontalline'
  };

  let objSubTitle = function (str) {
    return {
      type: 'text',
      val: str,
      opt: {font_face: '黑体', font_size: 12},
      lopt: {align: 'left'}
    };
  };

  let studentPlans = [
    [{
      val: '序 号',
      opts: {
        cellColWidth: 1500,
        b: true,
        sz: 20,
        shd: {
          fill: 'EEEEEE'
        },
        fontFamily: 'Times New Roman'
      }
    }, {
      val: '起止时间',
      opts: {
        cellColWidth: 3500,
        b: true,
        sz: 20,
        shd: {
          fill: 'EEEEEE'
        },
        fontFamily: 'Times New Roman'
      }
    }, {
      val: '内 容',
      opts: {
        cellColWidth: 4000,
        b: true,
        sz: 20,
        shd: {
          fill: 'EEEEEE'
        },
        fontFamily: 'Times New Roman'
      }
    }]
  ];

  let studentMeetings = [
    [{
      val: '序 号',
      opts: {
        cellColWidth: 1500,
        b: true,
        sz: 20,
        shd: {
          fill: 'EEEEEE'
        },
        fontFamily: 'Times New Roman'
      }
    },
      {
        val: '日 期',
        opts: {
          cellColWidth: 3500,
          b: true,
          sz: 20,
          shd: {
            fill: 'EEEEEE'
          },
          fontFamily: 'Times New Roman'
        }
      },
      {
        val: '内 容',
        opts: {
          cellColWidth: 4000,
          b: true,
          sz: 20,
          shd: {
            fill: 'EEEEEE'
          },
          fontFamily: 'Times New Roman'
        }
      }
    ]
  ];

  let studentFinal = [
    [{
      val: '评 级',
      opts: {
        cellColWidth: 1500,
        b: true,
        sz: 20,
        shd: {
          fill: 'EEEEEE'
        },
        fontFamily: 'Times New Roman'
      }
    }, {
      val: '评 语',
      opts: {
        cellColWidth: 7500,
        b: true,
        sz: 20,
        shd: {
          fill: 'EEEEEE'
        },
        fontFamily: 'Times New Roman'
      }
    }]
  ];

  // fill data
  for (let i = 0; i < planArr.length; i++) {
    if (cid === planArr[i].class_id) {
      studentPlans.push([{
        val: i + 1,
        opts: {
          cellColWidth: 1500,
          b: true,
          sz: 20,
          fontFamily: 'Times New Roman'
        }
      }, {
        val: planArr[i].start + '-' + planArr[i].deadline,
        opts: {
          cellColWidth: 3500,
          b: true,
          sz: 20,
          fontFamily: 'Times New Roman'
        }
      }, {
        val: planArr[i].content,
        opts: {
          cellColWidth: 4000,
          b: true,
          sz: 20,
          fontFamily: 'Times New Roman'
        }
      }]);
    }
  }

  for (let i = 0; i < meetingArr.length; i++) {
    if (cid === meetingArr[i].class_id) {
      studentMeetings.push([{
        val: i + 1,
        opts: {
          cellColWidth: 1500,
          b: true,
          sz: 20,
          fontFamily: 'Times New Roman'
        }
      }, {
        val: meetingArr[i].date,
        opts: {
          cellColWidth: 3500,
          b: true,
          sz: 20,
          fontFamily: 'Times New Roman'
        }
      }, {
        val: meetingArr[i].content,
        opts: {
          cellColWidth: 4000,
          b: true,
          sz: 20,
          fontFamily: 'Times New Roman'
        }
      }]);
    }
  }

  for (let i = 0; i < finalArr.length; i++) {
    if (cid === finalArr[i].class_id) {
      studentFinal.push([
        {
          val: finalArr[i].rate || '暂 无',
          opts: {
            cellColWidth: 1500,
            b: true,
            sz: 20,
            fontFamily: 'Times New Roman'
          }
        },
        {
          val: finalArr[i].remark || '暂 无',
          opts: {
            cellColWidth: 7500,
            b: true,
            sz: 20,
            fontFamily: 'Times New Roman'
          }
        }
      ]);
    }
  }

  if (!planArr.length) {
    studentPlans.push([{
      val: '暂 无',
      opts: {
        cellColWidth: 1500,
        b: true,
        sz: 20,
        fontFamily: 'Times New Roman'
      }
    }, {
      val: '暂 无',
      opts: {
        cellColWidth: 3500,
        b: true,
        sz: 20,
        fontFamily: 'Times New Roman'
      }
    }, {
      val: '暂 无',
      opts: {
        cellColWidth: 4000,
        b: true,
        sz: 20,
        fontFamily: 'Times New Roman'
      }
    }]);
  }

  if (!meetingArr.length) {
    studentMeetings.push([{
      val: '暂 无',
      opts: {
        cellColWidth: 1500,
        b: true,
        sz: 20,
        fontFamily: 'Times New Roman'
      }
    }, {
      val: '暂 无',
      opts: {
        cellColWidth: 3500,
        b: true,
        sz: 20,
        fontFamily: 'Times New Roman'
      }
    }, {
      val: '暂 无',
      opts: {
        cellColWidth: 4000,
        b: true,
        sz: 20,
        fontFamily: 'Times New Roman'
      }
    }]);
  }

  let tableStyle = {
    tableColWidth: 5000,
    tableSize: 16,
    tableAlign: 'left',
    tableFontFamily: 'Times New Roman',
    borders: true
  };

  let objCurClass = {
    type: 'text',
    val: '* 选课号：' + cid,
    opt: {font_face: 'Times New Roman', font_size: 12},
    lopt: {align: 'center'}
  };

  let objPlans = {
    type: 'table',
    val: studentPlans,
    opt: tableStyle
  };

  let objMeetings = {
    type: 'table',
    val: studentMeetings,
    opt: tableStyle
  };

  let objFinal = {
    type: 'table',
    val: studentFinal,
    opt: tableStyle
  };

  return [
    objCurClass,

    // personal plans
    [
      {
        align: 'left'
      },
      objSubTitle('个人计划：'),
      objPlans
    ],
    objSubTitle(''),

    // personal meeting records
    [
      {
        align: 'left'
      },
      objSubTitle('课堂记录：'),
      objMeetings
    ],
    objSubTitle(''),

    // personal final
    [
      {
        align: 'left'
      },
      objSubTitle('期末成绩：'),
      objFinal
    ],
    objSubTitle(''),
    objLine,
  ];
};

const exportPlansBySingle = function (profileObj, cid, callback) {

  const student_id = profileObj.school_id;
  const name = profileObj.name;
  const profile = profileObj;
  const planArr = profileObj.plans;
  const meetingArr = profileObj.meetings;
  const finalArr = profileObj.finals;

  // set filename
  let fileName = 'plan_export_' + student_id + name + '_' + (!!cid.length ? '' : 'allTerms_') + uid.generate() + '.docx';
  let filePath = pathLib.join(path.plans, fileName);

  // create file
  let docx = officeGen({
    type: 'docx',
    orientation: 'portrait'
  });

  docx.on('error', function (err) {
    console.log(err);
    callback(err);
  });

  let body = [];

  if (!cid.length) {
    let cidArr = JSON.parse(profile.prev_classes).data;
    for (let i = 0; i < cidArr.length; i++) {
      let curCid = JSON.parse(cidArr[i]).cid;
      let bodyPart = createData(planArr, meetingArr, finalArr, curCid);
      body = body.concat(bodyPart);
    }
  } else {
    body = createData(planArr, meetingArr, finalArr, cid);
  }

  const header = createHeader(profile);
  const footer = createFooter();

  const exportData = [].concat(header, body, footer);

  docx.createByJson(exportData);

  // export file
  let out = fs.createWriteStream(filePath);

  out.on('error', function (err) {
    console.log(err);
    callback(err);
  });

  async.parallel([
    function (done) {
      out.on('close', function () {
        done(null);
        callback(null, fileName);
      });
      docx.generate(out);
    }

  ], function (err) {
    if (err) {
      console.log('error: ' + err);
      callback(err);
    }
  });
};

const exportPlansByStudent = function (sid, cid, callback) {
  Profile.findOne({
    where: {
      school_id: sid,
    },
    include: [
      {
        model: Plan,
        order: [
          ['created_at', 'ASC']
        ],
        attributes: ['class_id', 'start', 'deadline', 'content', 'status']
      },
      {
        model: Meeting,
        order: [
          ['created_at', 'ASC']
        ],
        attributes: ['class_id', 'date', 'content']
      },
      {
        model: Final,
        order: [
          ['created_at', 'ASC']
        ],
        attributes: ['class_id', 'rate', 'remark']
      }
    ]
  }).then(function (profile) {
    if (!profile) {
      callback('profile does not exist');
    } else {
      exportPlansBySingle(profile.dataValues, cid, function (err, fileName) {
        callback(err, fileName);
      });
    }
  })
    .catch(function (e) {
      console.error(e);
      callback(e);
    });
};

const exportPlansByClass = function (cid, callback) {
  const zipPlans = function (class_id, callback) {
    let archiveName = 'plan_export_' + class_id + '_' + uid.generate() + '.zip';
    zipper.zip(path.plans, function (err, zipped) {
      if (!err) {
        zipped
          .compress()
          .save(pathLib.join(path.exportDir, archiveName), function (err) {
            if (!err) {
              console.log('plan: ' + archiveName + ' exported');
              callback(null, archiveName);
            } else {
              callback(err);
            }
          });
      } else {
        callback(err);
      }
    });
  };

  Profile.findAll({
    where: {
      cur_class: cid
    },
    include: [
      {
        model: Plan,
        order: [
          ['created_at', 'ASC']
        ],
        attributes: ['class_id', 'start', 'deadline', 'content', 'status']
      },
      {
        model: Meeting,
        order: [
          ['created_at', 'ASC']
        ],
        attributes: ['class_id', 'date', 'content']
      },
      {
        model: Final,
        order: [
          ['created_at', 'ASC']
        ],
        attributes: ['class_id', 'rate', 'remark']
      }
    ]
  }).then(function (profiles) {
    if (!profiles.length) {
      console.log('profile does not exist');
      callback('profile does not exist');
    } else {
      let flag = 0;
      for (let i = 0; i < profiles.length; i++) {
        exportPlansBySingle(profiles[i].dataValues, cid, function (err, fileName) {
          if (!err) {
            flag++;
            console.log(fileName + ' created.');
            if (flag === profiles.length) {
              zipPlans(cid, function (err, archiveName) {
                let files = fs.readdirSync(path.plans);
                files.forEach(function (file) {
                  fs.unlinkSync(path.plans + '/' + file);
                });
                console.log('dir: ' + path.plans + ' cleared.');
                callback(err, archiveName);
              });
            }
          } else {
            callback(err);
          }
        });
      }
    }
  })
    .catch(function (e) {
      console.error(e);
      callback(e);
    });
};

module.exports = {
  exportPlansByStudent,
  exportPlansByClass
};
