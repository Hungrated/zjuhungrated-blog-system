<template>
  <div id="teacher-center-main" class="g-teacher">
    <div class="g-teacher nav">
      <Menu mode="horizontal" theme="dark" active-name="1">
        <div class="m-nav">
          <MenuItem name="1">
            <span @click="changePanel('main-panel')">
              <Icon type="ios-list"></Icon>&emsp;主览面板
            </span>
          </MenuItem>
          <MenuItem name="2">
            <span @click="changePanel('plans')">
              <Icon type="university"></Icon>&emsp;班级与学生
            </span>
          </MenuItem>
          <MenuItem name="3">
            <span @click="changePanel('info-manage')">
              <Icon type="settings"></Icon>&emsp;全站信息管理
            </span>
          </MenuItem>
        </div>
      </Menu>
    </div>
    <div class="teacher-center-main">
      <teacher-center-main-panel v-if="panel === 'main-panel'"></teacher-center-main-panel>
      <teacher-center-plans v-if="panel === 'plans'"></teacher-center-plans>
      <teacher-center-info-manage v-if="panel === 'info-manage'"></teacher-center-info-manage>
    </div>
  </div>
</template>

<script>
  import teacherCenterMainPanel from '../../components/public/teacher-center-main-panel.vue';
  import teacherCenterPlans from '../../components/public/teacher-center-plans.vue';
  import teacherCenterInfoManage from '../../components/public/teacher-center-info-manage.vue';
  import { Menu, MenuItem, Icon } from 'iview';

  export default {
    name: 'teacher-center-main',
    components: {
      teacherCenterMainPanel,
      teacherCenterPlans,
      teacherCenterInfoManage,
      Menu,
      MenuItem,
      Icon
    },
    data () {
      return {
        panel: 'main-panel'
      };
    },
    methods: {
      changePanel (name) {
        this.panel = name;
      }
    }

  };
</script>

<style scoped lang="scss">
  @import '../../styles/teacher-center';
</style>
