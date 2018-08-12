<template>
  <div class="g-info">
    <div class="header">
      <div class="options">
        <Card disHover>
          <span slot="title" class="header-card">
            <strong>筛选条件</strong>
          </span>
          <div class="body">
            <div class="list">
              <div class="type">
                <Select placeholder="类 别..." size="large" v-model="infoLabel" @on-change="refreshData()">
                  <Option v-for="type in infoTypeList" :value="type.label" :key="type.index">
                    {{ type.value }}
                  </Option>
                </Select>
              </div>
              <div class="range">
                <DatePicker v-model="infoTimeStart"
                            size="large"
                            format="yyyy-MM-dd"
                            type="date"
                            placeholder="起始时间（选填）"
                            style="width: 165px">
                </DatePicker>
                <DatePicker v-model="infoTimeEnd"
                            size="large"
                            format="yyyy-MM-dd"
                            type="date"
                            placeholder="结束时间（选填）"
                            style="width: 165px">
                </DatePicker>
              </div>
              <div class="sid">
                <Input size="large"
                       v-model="infoSid"
                       placeholder="学号或工号（选填）"
                       :disabled="infoLabel === 'banner' || infoLabel === 'class' || infoLabel === 'image'"/>
              </div>
              <div class="label">
                <Input size="large"
                       v-model="infoLid"
                       placeholder="标签ID（选填）"
                       :disabled="infoLabel !== 'blog' && infoLabel !== 'resource'"/>
              </div>
            </div>
            <div class="query">
              <Button @click="refreshData()" type="primary" size="large">查 询</Button>
            </div>
          </div>
          <transition name="fade">
            <div v-if="infoLabel === 'banner'" class="banner">
              <span>
                &emsp;<Icon type="information-circled"></Icon>&nbsp;
                轮播图用于首页展示，要上传新的轮播图，请点击右边的"新增"按钮
              </span>
              <Button @click="bannerEdit()" type="dashed" size="small">新 增</Button>
              <Modal v-model="bannerMng"
                     title="编辑首页轮播图"
                     width="550"
                     @on-ok="bannerSubmit(bannerModMng, bannerImgId, bannerSrc)"
                     @on-cancel="bannerEditCancel()">
                <div class="m-edit-bnr">
                  <croppa v-model="myCroppa"
                          accept="image/*"
                          placeholder="单击以选择图片"
                          :placeholder-font-size="16"
                          :width="480"
                          :height="175"
                          :quality="3">
                  </croppa>
                  <span>
                    &emsp;<Icon type="information-circled"></Icon>&nbsp;
                    点击并拖动鼠标以定位，滚动鼠标滚轮以缩放
                  </span>
                </div>
              </Modal>
            </div>
            <div v-if="infoLabel === 'label'" class="label-edit">
              <span>
                &emsp;<Icon type="information-circled"></Icon>&nbsp;
                标签用于文章和资源文件的分类与筛选，要新增标签，请点击右边的"新增"按钮
              </span>
              <Button @click="labelEdit()" type="dashed" size="small">新 增</Button>
              <Modal v-model="labelMng"
                     title="编辑标签"
                     width="350"
                     @on-ok="labelSubmit()"
                     @on-cancel="labelEditCancel()">
                <div class="m-edit-label">
                  <Select placeholder="标签类别..." size="large" v-model="labelData.category" :disabled="labelNameMod">
                    <Option v-for="type in labelTypes" :value="type.value" :key="type.index">
                      {{ type.type }}
                    </Option>
                  </Select>
                  <Input size="large"
                         v-model="labelData.name"
                         placeholder="标签名..."/>
                </div>
              </Modal>
            </div>
          </transition>
          <Modal v-model="labelModFlag"
                 title="标签管理"
                 width="730"
                 @on-ok="labelModSubmit(labelModData)"
                 @on-cancel="labelModCancel()">
            <span>
              <span v-for="(label, index) in labelSelect" :key="label.label_id">
                <Tag closable
                     type="dot"
                     @on-close="delLabel(label)"
                     :name="index"
                     :color="label.category === 'both' ? 'blue' : (label.category === 'blog' ? 'green' : 'yellow')">
                    {{label.name}}
                </Tag>
              </span>
            </span>
            <label-selector ref="labels"
                            :type="labelModData.type"
                            :labelList="labelList"
                            :selectList="labelSelect"
                            @changeLabels="changeLabels"/>
          </Modal>
        </Card>
      </div>
      <div class="m-manage">
        <Card disHover>
          <div class="pages">
            <Page size="small"
                  show-total
                  :total="dataCount"
                  :page-size="pageLimit"
                  @on-change="changePage"></Page>
          </div>
          <div class="table">
            <Table stripe :columns="infoCols" :data="infoData"></Table>
          </div>
          <div class="pages">
            <Page size="small"
                  show-total
                  :total="dataCount"
                  :page-size="pageLimit"
                  @on-change="changePage"></Page>
          </div>
        </Card>
      </div>
    </div>
  </div>
</template>

<script>
  import labelSelector from '../public/label-select';
  import { Card, Select, Option, DatePicker, Input, Button, Modal, Tag, Page, Table, Icon } from 'iview';

  export default {
    name: 'teacher-center-info-manage',
    components: {
      labelSelector,
      Card,
      Select,
      Option,
      DatePicker,
      Input,
      Button,
      Modal,
      Tag,
      Page,
      Table,
      Icon
    },
    data () {
      return {
        pageLimit: 15,
        curPage: 1,
        dataCount: 0,
        infoLabel: 'banner',
        infoCols: [],
        infoData: [],
        infoTypeList: [
          {
            index: 0,
            value: '首页轮播图',
            label: 'banner'
          },
          {
            index: 1,
            value: '文 章',
            label: 'blog'
          },
          {
            index: 2,
            value: '图 片',
            label: 'image'
          },
          {
            index: 3,
            value: '评 论',
            label: 'comment'
          },
          {
            index: 4,
            value: '计 划',
            label: 'plan'
          },
          {
            index: 5,
            value: '课堂记录',
            label: 'meeting'
          },
          {
            index: 6,
            value: '资源文件',
            label: 'resource'
          },
          {
            index: 7,
            value: '班 级',
            label: 'class'
          },
          {
            index: 8,
            value: '标 签',
            label: 'label'
          }
        ],
        infoTimeStart: '',
        infoTimeEnd: '',
        infoSid: '',
        infoLid: '',
        queryCols: {
          banner: [
            {
              title: '轮播图ID',
              key: 'img_id',
              width: 120
            },
            {
              title: '图片预览',
              key: 'src',
              align: 'center',
              render: (h, params) => {
                return h('div', {
                  style: {
                    display: 'flex',
                    justifyContent: 'center'
                  }
                }, [
                  h('img', {
                    style: {
                      height: '50px',
                      margin: '5px'
                    },
                    attrs: {
                      src: params.row.src
                    }
                  }),
                  h(Button, {
                    props: {
                      type: 'dashed',
                      size: 'small'
                    },
                    style: {
                      margin: '18px 10px'
                    },
                    on: {
                      click: () => {
                        this.$Modal.info({
                          width: 75,
                          render: (h) => {
                            return h('img', {
                              style: {
                                width: '100%',
                                margin: '5px',
                                borderRadius: '5px'
                              },
                              attrs: {
                                src: params.row.src
                              }
                            });
                          }
                        });
                      }
                    }
                  }, [
                    h(Icon, {
                      props: {
                        type: 'ios-search-strong'
                      }
                    })
                  ])
                ]);
              }
            },
            {
              title: '上传者ID',
              key: 'uploader_id'
            },
            {
              title: '上传时间',
              key: 'created_at',
              sortable: true,
              render: (h, params) => {
                return h('span', this.getTime(params.row.created_at));
              }
            },
            {
              title: '状 态',
              key: 'status',
              width: 100
            },
            {
              title: '操 作',
              width: 225,
              align: 'center',
              render: (h, params) => {
                return h('div', [
                  h(Button, {
                    props: {
                      type: 'dashed',
                      size: 'small'
                    },
                    style: {
                      marginRight: '5px'
                    },
                    on: {
                      click: () => {
                        this.bannerModify(params.row.img_id, params.row.src);
                      }
                    }
                  }, '变更图片'),
                  h(Button, {
                    props: {
                      type: params.row.status === 'active' ? 'error' : 'success',
                      size: 'small'
                    },
                    style: {
                      marginRight: '5px'
                    },
                    on: {
                      click: () => {
                        let _this = this;
                        this.$Modal.confirm({
                          title: '确认切换状态',
                          content: '确定切换这张首页轮播图的展示状态？',
                          onOk () {
                            let curStatus = params.row.status;
                            _this.changeBannerImgStatus(params.row.img_id, curStatus);
                            params.row.status = (curStatus === 'archived') ? 'active' : 'archived';
                          }
                        });
                      }
                    }
                  }, '切换状态'),
                  h(Button, {
                    props: {
                      type: 'error',
                      size: 'small'
                    },
                    style: {
                      marginRight: '5px'
                    },
                    on: {
                      click: () => {
                        let _this = this;
                        this.$Modal.confirm({
                          title: '确认删除',
                          content: '确定删除这张首页轮播图？',
                          onOk () {
                            _this.infoDelete('banner', params.row.img_id);
                          }
                        });
                      }
                    }
                  }, '删 除')
                ]);
              }
            }
          ],
          blog: [
            {
              title: '文章ID',
              width: 135,
              key: 'blog_id'
            },
            {
              title: '发表时间',
              key: 'created_at',
              width: 135,
              sortable: true,
              render: (h, params) => {
                return h('span', this.getTime(params.row.created_at));
              }
            },
            {
              title: '封面图片',
              key: 'cover',
              align: 'center',
              render: (h, params) => {
                if (!params.row.cover) {
                  return h('em', '无');
                } else {
                  return h('div', {
                    style: {
                      display: 'flex',
                      justifyContent: 'center'
                    }
                  }, [
                    h('img', {
                      style: {
                        height: '50px',
                        margin: '5px'
                      },
                      attrs: {
                        src: params.row.cover
                      }
                    }),
                    h(Button, {
                      props: {
                        type: 'dashed',
                        size: 'small'
                      },
                      style: {
                        margin: '18px 10px'
                      },
                      on: {
                        click: () => {
                          this.$Modal.info({
                            width: 75,
                            render: (h) => {
                              return h('img', {
                                style: {
                                  width: '100%',
                                  margin: '5px',
                                  borderRadius: '5px'
                                },
                                attrs: {
                                  src: params.row.cover.replace('/thumbs', '')
                                }
                              });
                            }
                          });
                        }
                      }
                    }, [
                      h(Icon, {
                        props: {
                          type: 'ios-search-strong'
                        }
                      })])
                  ]);
                }
              }
            },
            {
              title: '作者ID',
              key: 'author_id',
              width: 100,
              sortable: true
            },
            {
              title: '标 题',
              key: 'title'
            },
            {
              title: '标 签',
              key: 'labels',
              align: 'center',
              render: (h, params) => {
                return h('div', [
                  h(Button, {
                    props: {
                      type: 'ghost',
                      size: 'small'
                    },
                    style: {
                      marginRight: '5px'
                    },
                    on: {
                      click: () => {
                        this.labelMod('blog', params.row.blog_id, params.row.labels);
                      }
                    }
                  }, '管 理')
                ]);
              }
            },
            {
              title: '描 述',
              key: 'description'
            },
            {
              title: '操 作',
              key: 'action',
              width: 135,
              render: (h, params) => {
                return h('div', [
                  h(Button, {
                    props: {
                      type: 'ghost',
                      size: 'small'
                    },
                    style: {
                      marginRight: '5px'
                    },
                    on: {
                      click: () => {
                        this.showDetails(params.row.content);
                      }
                    }
                  }, '查 看'),
                  h(Button, {
                    props: {
                      type: 'error',
                      size: 'small'
                    },
                    style: {
                      marginRight: '5px'
                    },
                    on: {
                      click: () => {
                        let _this = this;
                        this.$Modal.confirm({
                          title: '确认删除',
                          content: '确定删除此文章？（此文章所含评论与图片也将被删除）',
                          onOk () {
                            _this.infoDelete('blog', params.row.blog_id);
                          }
                        });
                      }
                    }
                  }, '删 除')
                ]);
              }
            }
          ],
          image: [
            {
              title: '图片ID',
              key: 'image_id',
              width: 120
            },
            {
              title: '图片预览',
              key: 'src',
              align: 'center',
              render: (h, params) => {
                return h('div', {
                  style: {
                    display: 'flex',
                    justifyContent: 'center'
                  }
                }, [
                  h('img', {
                    style: {
                      height: '50px',
                      margin: '5px'
                    },
                    attrs: {
                      src: this.getThumb(params.row.src)
                    }
                  }),
                  h(Button, {
                    props: {
                      type: 'dashed',
                      size: 'small'
                    },
                    style: {
                      margin: '18px 10px'
                    },
                    on: {
                      click: () => {
                        this.$Modal.info({
                          width: 75,
                          render: (h) => {
                            return h('img', {
                              style: {
                                width: '100%',
                                margin: '5px',
                                borderRadius: '5px'
                              },
                              attrs: {
                                src: params.row.src
                              }
                            });
                          }
                        });
                      }
                    }
                  }, [
                    h(Icon, {
                      props: {
                        type: 'ios-search-strong'
                      }
                    })])
                ]);
              }
            },
            {
              title: '所属文章ID',
              sortable: true,
              key: 'blog_id'
            },
            {
              title: '上传时间',
              key: 'created_at',
              sortable: true,
              render: (h, params) => {
                return h('span', this.getTime(params.row.created_at));
              }
            },
            {
              title: '操 作',
              width: 100,
              align: 'center',
              render: (h, params) => {
                return h('div', [
                  h(Button, {
                    props: {
                      type: 'error',
                      size: 'small'
                    },
                    style: {
                      marginRight: '5px'
                    },
                    on: {
                      click: () => {
                        let _this = this;
                        this.$Modal.confirm({
                          title: '确认删除',
                          content: '确定删除这张图片？（可能导致其无法在文章中正常显示）',
                          onOk () {
                            _this.infoDelete('image', params.row.image_id);
                          }
                        });
                      }
                    }
                  }, '删 除')
                ]);
              }
            }
          ],
          plan: [
            {
              title: '计划ID',
              key: 'plan_id',
              width: 120
            },
            {
              title: '学生ID',
              key: 'student_id',
              width: 120
            },
            {
              title: '学 年',
              key: 'year',
              width: 120,
              sortable: true
            },
            {
              title: '学 期',
              key: 'term',
              width: 70
            },
            {
              title: '实行日期',
              key: 'start',
              width: 120,
              sortable: true
            },
            {
              title: '截止日期',
              key: 'deadline',
              width: 120,
              sortable: true
            },
            {
              title: '内 容',
              key: 'content'
            },
            {
              title: '对应课程编号',
              key: 'class_id'
            },
            {
              title: '状 态',
              key: 'status',
              width: 75,
              render: (h, params) => {
                return h('div', [
                  h('strong', {
                    style: {
                      color: '#999999'
                    }
                  }, params.row.status)
                ]);
              }
            },
            {
              title: '审核变更',
              width: 125,
              render: (h, params) => {
                return h('div', [
                  h(Button, {
                    props: {
                      type: 'success',
                      size: 'small',
                      disabled: params.row.status === '已通过'
                    },
                    style: {
                      marginRight: '5px'
                    },
                    on: {
                      click: () => {
                        let _this = this;
                        this.$Modal.confirm({
                          title: '确认计划审核变更',
                          content: '确定变更这个计划的审核结果？',
                          onOk () {
                            _this.verifyPlan(params.row.plan_id, 1);
                          }
                        });
                      }
                    }
                  }, [
                    h(Icon, {
                      props: {
                        type: 'checkmark'
                      }
                    }),
                    h('span', '通 过')
                  ]),
                  h(Button, {
                    props: {
                      type: 'error',
                      size: 'small',
                      disabled: params.row.status === '未通过'
                    },
                    style: {
                      marginRight: '5px'
                    },
                    on: {
                      click: () => {
                        let _this = this;
                        this.$Modal.confirm({
                          title: '确认计划审核变更',
                          content: '确定变更这个计划的审核结果？',
                          onOk () {
                            _this.verifyPlan(params.row.plan_id, 0);
                          }
                        });
                      }
                    }
                  }, [
                    h(Icon, {
                      props: {
                        type: 'close'
                      }
                    })
                  ])
                ]);
              }
            }
          ],
          meeting: [
            {
              title: '记录日期',
              key: 'date',
              sortable: true,
              width: 120
            },
            {
              title: '学生ID',
              key: 'student_id',
              sortable: true,
              width: 120
            },
            {
              title: '选课课号',
              key: 'class_id',
              sortable: true
            },
            {
              title: '内 容',
              key: 'content'
            },
            {
              title: '操 作',
              key: 'action',
              width: 135,
              render: (h, params) => {
                return h('div', [
                  h(Button, {
                    props: {
                      type: 'ghost',
                      size: 'small'
                    },
                    style: {
                      marginRight: '5px'
                    },
                    on: {
                      click: () => {
                        this.showDetails(params.row.content);
                      }
                    }
                  }, '查 看'),
                  h(Button, {
                    props: {
                      type: 'error',
                      size: 'small'
                    },
                    style: {
                      marginRight: '5px'
                    },
                    on: {
                      click: () => {
                        let _this = this;
                        this.$Modal.confirm({
                          title: '确认删除',
                          content: '确定删除此条课堂记录？',
                          onOk () {
                            _this.infoDelete('meeting', params.row.rec_id);
                          }
                        });
                      }
                    }
                  }, '删 除')
                ]);
              }
            }
          ],
          resource: [
            {
              title: '文件ID',
              key: 'file_id'
            },
            {
              title: '上传者ID',
              key: 'uploader_id',
              sortable: true
            },
            {
              title: '上传时间',
              key: 'created_at',
              sortable: true,
              render: (h, params) => {
                return h('span', this.getTime(params.row.created_at));
              }
            },
            {
              title: '标 签',
              key: 'labels',
              align: 'center',
              width: 80,
              render: (h, params) => {
                return h('div', [
                  h(Button, {
                    props: {
                      type: 'ghost',
                      size: 'small'
                    },
                    style: {
                      marginRight: '5px'
                    },
                    on: {
                      click: () => {
                        this.labelMod('file', params.row.file_id, params.row.labels);
                      }
                    }
                  }, '管 理')
                ]);
              }
            },
            {
              title: '文件名',
              key: 'filename'
            },
            {
              title: '文件大小',
              key: 'size',
              sortable: true,
              render: (h, params) => {
                return h('div', params.row.size + ' Bytes');
              }
            },
            {
              title: '文件描述',
              key: 'description'
            },
            {
              title: '操 作',
              key: 'ops',
              width: 80,
              render: (h, params) => {
                return h('div', [
                  h(Button, {
                    props: {
                      type: 'error',
                      size: 'small'
                    },
                    style: {
                      marginRight: '5px'
                    },
                    on: {
                      click: () => {
                        let _this = this;
                        this.$Modal.confirm({
                          title: '确认删除',
                          content: '确定删除此文件？',
                          onOk () {
                            _this.infoDelete('resource', params.row.file_id);
                          }
                        });
                      }
                    }
                  }, '删 除')
                ]);
              }
            }
          ],
          comment: [
            {
              title: '评论ID',
              key: 'comment_id',
              width: 100,
              sortable: true
            },
            {
              title: '评论者ID',
              key: 'student_id',
              sortable: true
            },
            {
              title: '评论时间',
              key: 'created_at',
              sortable: true,
              render: (h, params) => {
                return h('span', this.getTime(params.row.created_at));
              }
            },
            {
              title: '评论内容',
              key: 'content'
            },
            {
              title: '文章ID',
              key: 'blog_id'
            },
            {
              title: '操 作',
              key: 'ops',
              width: 80,
              render: (h, params) => {
                return h('div', [
                  h(Button, {
                    props: {
                      type: 'error',
                      size: 'small'
                    },
                    style: {
                      marginRight: '5px'
                    },
                    on: {
                      click: () => {
                        let _this = this;
                        this.$Modal.confirm({
                          title: '确认删除',
                          content: '确定删除此条评论？',
                          onOk () {
                            _this.infoDelete('comment', params.row.comment_id);
                          }
                        });
                      }
                    }
                  }, '删 除')
                ]);
              }
            }
          ],
          classes: [
            {
              title: '课程ID',
              key: 'class_id'
            },
            {
              title: '课程名称',
              key: 'cname',
              width: 120,
              sortable: true
            },
            {
              title: '学 年',
              key: 'year',
              width: 120,
              sortable: true
            },
            {
              title: '学 期',
              key: 'term',
              width: 70
            },
            {
              title: '上课时间',
              key: 'time'
            },
            {
              title: '上课地点',
              key: 'loc'
            },
            {
              title: '状 态',
              key: 'status',
              width: 100
            },
            {
              title: '操 作',
              width: 100,
              render: (h, params) => {
                return h('div', [
                  h(Button, {
                    props: {
                      type: params.row.status === 'active' ? 'error' : 'success',
                      size: 'small'
                    },
                    style: {
                      marginRight: '5px'
                    },
                    on: {
                      click: () => {
                        let _this = this;
                        this.$Modal.confirm({
                          title: '确认切换课程状态',
                          content: '确定切换此课程的状态？',
                          onOk () {
                            let curStatus = params.row.status;
                            _this.changeClassStatus(params.row.class_id, curStatus);
                            params.row.status = (curStatus === 'archived') ? 'active' : 'archived';
                          }
                        });
                      }
                    }
                  }, '切换状态')
                ]);
              }
            }
          ],
          labels: [
            {
              title: '标签ID',
              key: 'label_id',
              width: 100
            },
            {
              title: '标签名称',
              key: 'name',
              sortable: true
            },
            {
              title: '所属种类',
              key: 'category',
              sortable: true
            },
            {
              title: '添加时间',
              key: 'created_at',
              sortable: true,
              render: (h, params) => {
                return h('span', this.getTime(params.row.created_at));
              }
            },
            {
              title: '添加者ID',
              key: 'adder_id',
              sortable: true
            },
            {
              title: '操 作',
              width: 150,
              render: (h, params) => {
                return h('div', [
                  h(Button, {
                    props: {
                      type: 'dashed',
                      size: 'small'
                    },
                    style: {
                      marginRight: '5px'
                    },
                    on: {
                      click: () => {
                        this.labelNameModify(params.row);
                      }
                    }
                  }, '修 改'),
                  h(Button, {
                    props: {
                      type: 'error',
                      size: 'small'
                    },
                    style: {
                      marginRight: '5px'
                    },
                    on: {
                      click: () => {
                        let _this = this;
                        this.$Modal.confirm({
                          title: '确认删除',
                          content: '确定删除此标签？（标记此标签的文章或资源文件将不受影响）',
                          onOk () {
                            _this.infoDelete('label', params.row.label_id);
                          }
                        });
                      }
                    }
                  }, '删 除')
                ]);
              }
            }
          ]
        },
        bannerMng: false,
        bannerModMng: false,
        bannerImgId: null,
        bannerSrc: null,
        labelMng: false,
        labelNameMod: false,
        labelTypes: [
          {
            index: 0,
            type: '文章标签',
            value: 'blog'
          },
          {
            index: 1,
            type: '资源文件标签',
            value: 'file'
          },
          {
            index: 2,
            type: '通用标签',
            value: 'both'
          }
        ],
        labelData: {
          name: '',
          category: 'both'
        },
        uploadConfig: {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        },
        myCroppa: {},
        labelModFlag: false,
        labelModData: {
          type: '',
          labels: '',
          id: ''
        },
        labelList: [],
        labelSelect: []
      };
    },
    methods: {
      getTime (createdAt) {
        let curTime = new Date(createdAt);
        let convert = function (digit) {
          if (digit < 10) return '0' + digit;
          else return digit.toString();
        };
        let year = curTime.getFullYear();
        let month = convert(curTime.getMonth() + 1);
        let day = convert(curTime.getDate());
        return year + '-' + month + '-' + day;
      },
      getThumb (src) {
        let name = src.split('/images/blogs/')[1].split('/')[1];
        return src.replace(new RegExp(name), 'thumbs/' + name);
      },
      showDetails (content) {
        this.$Modal.info({
          width: 80,
          render: (h) => {
            return h('div', {
              style: {
                wordWrap: 'break-word'
              }
            }, [
              h('div', '内 容：'),
              h('div', content)
            ]);
          }
        });
      },
      changePage (page) {
        this.curPage = page;
        this.refreshData();
        window.scrollTo(0, 0);
      },
      infoQuery (params) {
        let _this = this;
        let queryString = `/api/teacher/query?type=${params.type}&limit=${params.limit}&page=${params.page}`;
        if (params.sid) {
          queryString = queryString + '&sid=' + params.sid;
        }
        if (params.start) {
          queryString = queryString + `&start=${params.start}`;
        }
        if (params.end) {
          queryString = queryString + `&end=${params.end}`;
        }
        if (params.lid && (params.type === 'blog' || params.type === 'file')) {
          queryString = queryString + `&lid=${params.lid}`;
        }
        this.$ajax.get(queryString).then(function (res) {
          switch (params.type) {
            case 'blog':
              _this.infoCols = _this.queryCols.blog;
              _this.refreshLabelList('blog');
              break;
            case 'image':
              _this.infoCols = _this.queryCols.image;
              break;
            case 'plan':
              _this.infoCols = _this.queryCols.plan;
              break;
            case 'meeting':
              _this.infoCols = _this.queryCols.meeting;
              break;
            case 'resource':
              _this.infoCols = _this.queryCols.resource;
              _this.refreshLabelList('file');
              break;
            case 'comment':
              _this.infoCols = _this.queryCols.comment;
              break;
            case 'class':
              _this.infoCols = _this.queryCols.classes;
              break;
            case 'banner':
              _this.infoCols = _this.queryCols.banner;
              break;
            case 'label':
              _this.infoCols = _this.queryCols.labels;
              break;
          }
          _this.infoData = res.data.rows;
          _this.dataCount = res.data.count;
        }).catch(function (e) {
          console.log(e);
        });
      },
      infoDelete (type, id) {
        let _this = this;
        this.$ajax.post('/api/teacher/delete', {
          type: type,
          id: id
        }).then(function (res) {
          _this.refreshData();
          _this.$Message.success(res.data.msg);
        }).catch(function (e) {
          console.log(e);
        });
      },
      refreshData () {
        this.infoQuery({
          type: this.infoLabel,
          start: this.infoTimeStart ? this.infoTimeStart.getTime() : '',
          end: this.infoTimeEnd ? this.infoTimeEnd.getTime() : '',
          sid: this.infoSid,
          lid: this.infoLid,
          limit: this.pageLimit,
          page: this.curPage
        });
      },
      verifyPlan (id, op, cb) {
        let _this = this;
        this.$ajax.post('/api/plan/op', {
          plan_id: id,
          op: op
        }).then(function (res) {
          _this.refreshData();
          _this.$Message.success(res.data.msg);
        }).catch(function (e) {
          console.log(e);
        });
      },
      changeClassStatus (id, curStatus) {
        let _this = this;
        this.$ajax.post('/api/class/switch', {
          class_id: id,
          op: curStatus === 'archived' ? 1 : 0
        }).then(function (res) {
          _this.$Message.success(res.data.msg);
        }).catch(function (e) {
          console.log(e);
        });
      },
      bannerEdit () {
        this.bannerMng = true;
      },
      bannerModify (id, src) {
        this.bannerMng = true;
        this.bannerModMng = true;
        this.bannerImgId = id;
        this.bannerSrc = src;
      },
      bannerEditCancel () {
        this.bannerMng = false;
        this.bannerModMng = false;
      },
      bannerSubmit (isModify, id, src) {
        this.myCroppa.generateBlob((blob) => {
          if (blob === null) {
            this.$Message.info('请选择需要上传的图片');
            return;
          }
          let _this = this;
          let formData = new FormData();
          formData.append('banner', blob);
          if (!isModify) {
            this.$ajax.post('/api/banner/upload', formData, this.uploadConfig).then(function (res) {
              _this.$Message.success(res.data.msg);
              _this.myCroppa.remove();
              _this.refreshData();
            }).catch(function (e) {
              console.log(e);
            });
          } else {
            formData.append('img_id', id);
            formData.append('src', src);
            this.$ajax.post('/api/banner/modify', formData, this.uploadConfig).then(function (res) {
              _this.$Message.success(res.data.msg);
              _this.myCroppa.remove();
              _this.bannerModMng = false;
              _this.bannerImgId = null;
              _this.bannerImgSrc = null;
              _this.refreshData();
            }).catch(function (e) {
              console.log(e);
            });
          }
        }, 'image/jpeg', 0.8);
      },
      changeBannerImgStatus (id, curStatus) {
        let _this = this;
        this.$ajax.post('/api/banner/switch', {
          img_id: id,
          op: curStatus === 'archived' ? 1 : 0
        }).then(function (res) {
          _this.$Message.success(res.data.msg);
        }).catch(function (e) {
          console.log(e);
        });
      },
      labelEdit () {
        this.labelMng = true;
      },
      labelNameModify (paramsRow) {
        this.labelMng = true;
        this.labelNameMod = true;
        this.labelData = {
          id: paramsRow.label_id,
          name: paramsRow.name,
          category: paramsRow.category
        };
      },
      labelEditCancel () {
        this.labelMng = false;
        this.labelNameMod = false;
        this.labelData = {
          name: '',
          category: 'both'
        };
      },
      labelSubmit () {
        if (this.labelData.name === '') {
          this.$Message.info('请填写标签名称');
          return;
        }
        let _this = this;
        let labelData = {
          label_name: this.labelData.name,
          category: this.labelData.category
        };
        let url = this.labelNameMod ? '/api/label/modname' : '/api/label/submit';
        if (this.labelNameMod) {
          labelData.label_id = this.labelData.id;
        }
        this.$ajax.post(url, labelData).then(function (res) {
          _this.$Message.success(res.data.msg);
          _this.labelData = {
            name: '',
            category: 'both'
          };
          _this.labelMng = false;
          _this.labelNameMod = false;
          _this.refreshData();
        }).catch(function (e) {
          console.log(e);
        });
      },
      stringifyLabels () {
        let labels = [];
        for (let i = 0; i < this.labelSelect.length; i++) {
          labels.push(this.labelSelect[i].label_id);
        }
        return labels.toString();
      },
      changeLabels (labelSelect) {
        this.labelSelect = labelSelect;
        this.labelModData.labels = this.stringifyLabels();
      },
      delLabel (label) {
        const index = this.labelSelect.indexOf(label);
        this.labelSelect.splice(index, 1);
        this.labelModData.labels = this.stringifyLabels();
      },
      getLabel (index) {
        let labelList = this.labelList;
        for (let i = 0; i < labelList.length; i++) {
          if (labelList[i].label_id.toString() === index.toString()) {
            return labelList[i];
          }
        }
        return null;
      },
      parseLabel (labels) {
        let res = [];
        let labelIds = labels.toString().split(',');
        for (let i = 0; i < labelIds.length; i++) {
          let label = this.getLabel(labelIds[i]);
          if (label !== null) {
            res.push(label);
          }
        }
        return res;
      },
      labelMod (type, id, labels) {
        this.labelSelect = this.parseLabel(labels);
        this.labelModFlag = true;
        this.labelModData = {
          type: type,
          id: id,
          labels: labels
        };
      },
      labelModCancel () {
        this.labelModFlag = false;
        this.labelModData.type = '';
      },
      labelModSubmit (data) {
        if (!this.labelSelect.length) {
          this.$Message.info('请至少添加一个标签再试');
          return;
        }
        let _this = this;
        this.$ajax.post('/api/label/mod', data).then(function (res) {
          _this.$Message.success(res.data.msg);
          _this.labelSelect = [];
          _this.refreshData();
        }).catch(function (e) {
          console.log(e);
        });
      },
      refreshLabelList (type) {
        let _this = this;
        this.$ajax.post('/api/label/query', {
          type: type
        }).then(function (res) {
          _this.labelList = res.data;
        }).catch(function (e) {
          console.log(e);
        });
      }
    },
    mounted () {
      this.refreshData();
    }
  };
</script>

<style lang="scss">
  @import '../../styles/info-manage';
</style>
