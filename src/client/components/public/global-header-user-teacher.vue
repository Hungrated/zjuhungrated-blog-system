<template>
  <div class="m-users">
    <Submenu name="9">
      <template slot="title">
        <router-link tag="span" to="/teacher-center">
          <span @click="scrollTop">
            <Icon type="person"></Icon>
            {{name}}
          </span>
        </router-link>
      </template>
      <MenuGroup title="档 案">
        <MenuItem name="9-0" @click="changeRoute('/teacher-center')">
          <span>
            <strong><Icon type="person"></Icon>&emsp;{{name}}</strong>
          </span>
          <br>
          <span>
            <Icon type="card"></Icon>&emsp;{{schoolId}}
          </span>
        </MenuItem>
      </MenuGroup>
      <MenuGroup title="管 理">
        <MenuItem name="9-1"><span @click="changeRoute('/teacher-center')">管理中心</span></MenuItem>
        <MenuItem name="9-2"><span @click="pwdMod = true">修改密码</span></MenuItem>
      </MenuGroup>
      <MenuGroup title="后 台">
        <MenuItem name="9-3"><span @click="revealPage('docs')">查看API</span></MenuItem>
        <MenuItem name="9-4"><span @click="revealPage('admin')">管理员</span></MenuItem>
      </MenuGroup>
      <MenuGroup title="用 户">
        <MenuItem name="9-5"><span @click="logout()">退出登录</span></MenuItem>
      </MenuGroup>
    </Submenu>
    <Modal
      v-model="pwdMod"
      title="修改密码"
      @on-ok="userPwdMod()">
      <div class="m-login">
        <i-input class="m-login input" type="password" v-model="password.currentPwd" placeholder="当前密码">
          <Icon type="ios-locked-outline" slot="prepend"></Icon>
        </i-input>
        <i-input class="m-login input" type="password" v-model="password.newPwd" placeholder="新密码">
          <Icon type="ios-locked" slot="prepend"></Icon>
        </i-input>
        <i-input class="m-login input" type="password" v-model="password.newPwdChk" placeholder="重复新密码">
          <Icon type="ios-locked" slot="prepend"></Icon>
        </i-input>
      </div>
    </Modal>
  </div>
</template>

<script>
  import crypto from 'crypto';
  import { Menu, Submenu, MenuItem, MenuGroup, Modal, Icon, Input } from 'iview';

  export default {
    name: 'global-header-user-teacher',
    props: ['name', 'schoolId'],
    components: {
      Menu, Submenu, MenuItem, MenuGroup, Modal, Icon, iInput: Input
    },
    data () {
      return {
        pwdMod: false,
        password: {
          currentPwd: '',
          newPwd: '',
          newPwdChk: ''
        }
      };
    },
    methods: {
      changeRoute: function (path) {
        this.$router.push(path);
        window.scrollTo(0, 0);
      },
      revealPage (str) {
        let location = window.location;
        let url = `${location.protocol}//${location.host}/api/${str}`;
        window.open(url);
      },
      convertPwd (password) {
        return crypto.createHash('sha256')
          .update('innovation-20180305-practice-hduhungrated' + password)
          .digest('hex')
          .slice(0, 255);
      },
      userPwdMod () {
        if (this.password.currentPwd === '' ||
          this.password.newPwd === '' ||
          this.password.newPwdChk === '') {
          this.$Message.info('请完善相关信息再试');
          return;
        } else if (this.password.newPwd.length < 8) {
          this.$Message.info('请至少输入八位字符的密码');
          return;
        }
        if (this.password.newPwd !== this.password.newPwdChk) {
          this.$Message.error('密码修改失败：新密码两次输入不一致');
          return;
        }
        let _this = this;
        this.$ajax.post('/api/user/pwdmod', {
          password: this.convertPwd(_this.password.currentPwd),
          new_password: this.convertPwd(_this.password.newPwd)
        }).then(function (res) {
          if (res.data.status === 1500) {
            _this.$Message.success(res.data.msg);
          }
        }).catch(function (e) {
          console.log(e);
        });
      },
      logout () {
        let _this = this;
        this.$ajax.get('/api/user/logout').then(function (res) {
          _this.$Message.success(res.data.msg);
          _this.$emit('updateUserStatus');
          _this.changeRoute('/index');
        }).catch(function (e) {
          console.log(e);
        });
      },
      scrollTop () {
        window.scrollTo(0, 0);
      }
    }
  };
</script>

<style scoped lang="scss">
  @import "../../styles/header-user";
</style>
