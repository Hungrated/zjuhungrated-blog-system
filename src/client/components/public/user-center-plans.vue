<template>
  <div id="plan-container" class="m-plan">
    <transition name="fade">
      <div class="m-edit border" v-if="planEdit || planModify">
        <div class="m-edit header">
          <span><strong>编辑计划</strong></span>
          <span>
            <Button type="text" size="small" @click="editPlanCancel()">取 消</Button>
            <Button v-if="planEdit === true" type="primary" size="small" @click="submitPlan(null)">保 存</Button>
            <Button v-if="planModify === true" type="primary" size="small" @click="submitPlan('modify')">修 改</Button>
          </span>
        </div>
        <div class="m-edit body">
          <div class="m-edit left">
            <div class="m-edit unit">
              <i-input v-model="planUnit.term" placeholder="学 期" disabled/>
            </div>
            <div class="m-edit unit">
              <DatePicker v-model="planUnit.range"
                          format="yyyy-MM-dd"
                          type="daterange"
                          placeholder="计划起止日期"
                          style="width: 100%">
              </DatePicker>
            </div>
          </div>
          <div class="m-edit right">
            <div class="m-text">
              <i-input class="m-text area"
                       type="textarea"
                       v-model="planUnit.content"
                       placeholder="计划内容..."
                       :rows="3">
              </i-input>
            </div>
          </div>
        </div>
      </div>
    </transition>
    <div class="m-plan list" v-if="!planEmpty">
      <Table :columns="planCols" :data="planData" style="min-width: 800px" stripe></Table>
    </div>
    <div class="m-plan empty" v-if="planEmpty">
      <span><strong>当前暂无计划</strong>&emsp;<Button type="primary" size="large" @click="editPlan()">制定一个新计划</Button></span>
    </div>
  </div>
</template>

<script>
  import { Button, Input, DatePicker, Table } from 'iview';

  export default {
    name: 'user-center-plans',
    components: {
      Button, iInput: Input, DatePicker, Table
    },
    data () {
      return {
        planEmpty: true,
        planEdit: false,
        planModify: false,
        planUnit: {
          id: '',
          term: '',
          range: ['', ''],
          content: ''
        },
        curClass: '',
        terms: [
          {
            index: 0,
            label: '2017-2018-1'
          },
          {
            index: 1,
            label: '2017-2018-2'
          },
          {
            index: 2,
            label: '2018-2019-1'
          },
          {
            index: 3,
            label: '2018-2019-2'
          }
        ],
        planCols: [
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
            title: '操 作',
            key: 'action',
            width: 150,
            align: 'center',
            render: (h, params) => {
              return h('div', [
                h(Button, {
                  props: {
                    type: 'primary',
                    size: 'small',
                    disabled: params.row.status === '已通过'
                  },
                  style: {
                    marginRight: '5px'
                  },
                  on: {
                    click: () => {
                      this.modifyPlan(params.row);
                    }
                  }
                }, '编 辑')
              ]);
            }
          }
        ],
        planData: []
      };
    },
    methods: {
      date (time) {
        let curTime = time;
        let convert = function (digit) {
          if (digit < 10) return '0' + digit;
          else return digit.toString();
        };
        let year = curTime.getFullYear();
        let month = convert(curTime.getMonth() + 1);
        let day = convert(curTime.getDate());
        return year + '-' + month + '-' + day;
      },
      getTerm () {
        return this.curClass.substring(1, 12);
      },
      editPlan () {
        if (!this.planEdit && !this.planModify) {
          this.planEdit = true;
          this.planEmpty = false;
          this.planUnit.term = this.getTerm();
        }
      },
      editPlanCancel () {
        // this.$Message.info('编辑计划取消');
        this.planEdit = false;
        this.planModify = false;
        this.planUnit = {
          plan_id: '',
          term: '',
          range: ['', ''],
          content: ''
        };
      },
      modifyPlan (plan) {
        if (this.planEdit) {
          return;
        }
        this.planModify = true;
        this.planUnit = {
          plan_id: plan.plan_id,
          term: plan.year + '-' + plan.term,
          range: [plan.start, plan.deadline],
          content: plan.content
        };
      },
      submitPlan (op) {
        if (!this.planUnit.term || !this.planUnit.range || !this.planUnit.content) {
          this.$Message.info('请将计划内容填写完整');
          return;
        }
        let _this = this;
        let url = '/api/plan/submit';
        let planData = {
          year: this.planUnit.term.split('-')[0] + '-' + this.planUnit.term.split('-')[1],
          term: this.planUnit.term.split('-')[2],
          content: this.planUnit.content,
          start: this.date(this.planUnit.range[0]),
          deadline: this.date(this.planUnit.range[1])
        };
        if (op === 'modify') {
          url = '/api/plan/modify';
          planData.plan_id = this.planUnit.plan_id;
          delete planData.class_id;
        }
        this.$ajax.post(url, planData).then(function (res) {
          if (res.data.status === 5000 || res.data.status === 5100) {
            _this.$Message.success(res.data.msg);
          }
          _this.planUnit = {
            plan_id: '',
            term: '',
            range: ['', ''],
            content: ''
          };
          if (op === 'modify') {
            _this.planModify = false;
          } else {
            _this.planEdit = false;
          }
          _this.refreshPlanList();
        }).catch(function (e) {
          console.log(e);
        });
      },
      refreshPlanList () {
        let _this = this;
        this.$ajax.post('/api/plan/query', {
          request: 'sid'
        }).then(function (res) {
          if (res.data.plans.length) {
            _this.planEmpty = false;
          }
          _this.planData = res.data.plans;
          _this.curClass = res.data.cur_class;
        }).catch(function (e) {
          console.log(e);
        });
      }
    },
    mounted () {
      this.refreshPlanList();
      this.getTerm();
    }
  };
</script>

<style scoped lang="scss">
  @import '../../styles/user-center-plans';
</style>
