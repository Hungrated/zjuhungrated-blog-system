<template>
  <div class="m-users">
    <Submenu name="7">
      <template slot="title">
        <Icon type="person"></Icon>&nbsp;
      </template>
      <MenuGroup title="用 户">
        <MenuItem name="7-1"><span class="login-btn" @click="userMng = true">登 录</span></MenuItem>
      </MenuGroup>
    </Submenu>
    <Modal
      v-model="userMng"
      title="用户登录"
      @on-ok="handleSubmit()">
      <!--用户输入框-->
      <div class="m-login">
        <i-input class="m-login input" type="text" v-model="signInData.username" placeholder="用户名">
          <Icon type="ios-person-outline" slot="prepend"></Icon>
        </i-input>
        <i-input class="m-login input" type="password" v-model="signInData.password" placeholder="密码">
          <Icon type="ios-locked-outline" slot="prepend"></Icon>
        </i-input>
      </div>
    </Modal>
  </div>
</template>

<script>
  import crypto from 'crypto';
  import { Menu, Submenu, MenuItem, MenuGroup, Modal, Icon, Input } from 'iview';

  export default {
    name: 'global-header-user',
    components: {
      Menu,
      Submenu,
      MenuItem,
      MenuGroup,
      Modal,
      Icon,
      iInput: Input
    },
    data () {
      return {
        userMng: false,
        signInData: {
          username: '',
          password: ''
        },
        userIdentity: 'none'
      };
    },
    methods: {
      convertPwd (password) {
        return crypto.createHash('sha256')
          .update('innovation-20180305-practice-hduhungrated' + password)
          .digest('hex').slice(0, 255);
      },
      handleSubmit () {
        let _this = this;
        this.signInData.password = this.convertPwd(this.signInData.password);
        this.$ajax.post('/api/user/login', this.signInData)
          .then(function (res) {
            _this.$Message.success(res.data.msg);
            let user = {};
            user.id = res.data.id;
            user.school_id = res.data.school_id;
            user.name = res.data.name;
            user.cur_class = res.data.cur_class;
            _this.$emit('updateUserStatus');
          })
          .catch(function (e) {
            console.log(e);
          });
      }
    }
  };
</script>

<style scoped lang="scss">
  @import "../../styles/header-user";
</style>
