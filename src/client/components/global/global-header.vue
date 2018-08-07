<template>
  <header id="global-header" class="g-header-container">
    <Menu mode="horizontal" class="g-header" id="J_nav" theme="dark">
      <div class="brand">
        <router-link tag="span" to="/index"><img :src="brand.src"></router-link>
      </div>
      <ul class="nav">
        <MenuItem name="1">
          <router-link tag="span" to="/index">
            <Icon type="home"></Icon>
            &nbsp;<span @click="scrollTop">主 页</span>
          </router-link>
        </MenuItem>
        <MenuItem name="2">
          <router-link tag="span" to="/moments">
            <Icon type="android-star-outline"></Icon>
            &nbsp;<span @click="scrollTop">动 态</span>
          </router-link>
        </MenuItem>
        <MenuItem name="3">
          <router-link tag="span" to="/articles">
            <Icon type="document-text"></Icon>
            &nbsp;<span @click="scrollTop">文 章</span>
          </router-link>
        </MenuItem>
        <MenuItem name="4">
          <router-link tag="span" to="/resources">
            <Icon type="folder"></Icon>
            &nbsp;<span @click="scrollTop">资源共享</span>
          </router-link>
        </MenuItem>
      </ul>
      <div v-model="userIdentity">
        <global-header-user v-if="userIdentity === 'none'"
                            @updateUserStatus="changeUserStatus()"/>
        <global-header-user-student :name="name"
                                    :schoolId="schoolId"
                                    v-if="userIdentity === 'student'"
                                    @updateUserStatus="changeUserStatus()"/>
        <global-header-user-teacher :name="name"
                                    :schoolId="schoolId"
                                    v-if="userIdentity === 'teacher'"
                                    @updateUserStatus="changeUserStatus()"/>
      </div>
    </Menu>
  </header>
</template>
<script>
  import globalHeaderUser from '../public/global-header-user';
  import globalHeaderUserStudent from '../public/global-header-user-student';
  import globalHeaderUserTeacher from '../public/global-header-user-teacher';
  import { Menu, MenuItem, Icon } from 'iview';

  export default {
    name: 'global-header',
    data () {
      return {
        brand: {
          src: require('../../assets/innovation_practice_brand.png')
        },
        userIdentity: 'none',
        username: '',
        name: '',
        schoolId: 0
      };
    },
    components: {
      globalHeaderUser,
      globalHeaderUserStudent,
      globalHeaderUserTeacher,
      Menu,
      MenuItem,
      Icon
    },
    methods: {
      getCookie () {
        let cookie = {};
        let cookieArr = document.cookie.split(' ');
        for (let i = 0; i < cookieArr.length; i++) {
          let unit = cookieArr[i].split(';')[0];
          cookie[unit.split('=')[0]] = unit.split('=')[1];
        }
        return cookie;
      },
      changeUserStatus () {
        const token = this.getCookie().token;
        if (!token) {
          this.userIdentity = 'none';
        } else {
          let _this = this;
          this.$ajax.get('/api/user/token').then(function (res) {
            _this.userIdentity = res.data.identity;
            _this.username = res.data.username;
            _this.name = res.data.name;
            _this.schoolId = res.data.school_id;
          }).catch(function (e) {
            console.log(e);
          });
        }
      },
      changeRoute: function (path) {
        this.$router.push(path);
        window.scrollTo(0, 0);
      },
      scrollTop () {
        window.scrollTo(0, 0);
      }
    },
    mounted () {
      this.changeUserStatus();
    }
  };
</script>

<style scoped lang="scss">
  @import "../../styles/header";
</style>
