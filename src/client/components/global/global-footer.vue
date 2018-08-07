<template>
  <footer id="global-footer" class="g-footer">
    <Row>
      <i-col span="7">
        <div class="sites">
          <strong class="title">服务与支持</strong>
          <router-link class="sites-col" tag="span" v-for="site in sites.siteList0" :key="site.id" :to="site.route">
            <Button @click="scrollTop" type="text">{{site.text}}</Button>
          </router-link>
        </div>
      </i-col>
      <i-col span="7">
        <div class="sites">
          <strong class="title">帮 助</strong>
          <span class="sites-col">
            <Button @click="toGuide" type="text">使用说明</Button>
          </span>
          <span class="sites-col">
            <Button @click="toAbout" type="text">关于《创新实践》课程交流互动平台</Button>
          </span>
          <!--<router-link class="sites-col" tag="span" v-for="site in sites.siteList1" :key="site.id" :to="site.route">-->
            <!--<Button @click="scrollTop" type="text" size="small">{{site.text}}</Button>-->
          <!--</router-link>-->
        </div>
      </i-col>
    </Row>
    <div class="divider"></div>
    <span class="cprt">
      <span>Copyright © 2018 Hungrated, Hangzhou Dianzi University, All rights reserved.</span><br>
      <a target="_blank" href="http://www.miitbeian.gov.cn/">浙ICP备 18013714号</a>
    </span>
  </footer>
</template>

<script>
  import { Row, Col, Button } from 'iview';
  export default {
    name: 'global-footer',
    components: {
      Row, iCol: Col, Button
    },
    data () {
      return {
        sites: {
          siteList0: [
            {id: 0, text: '主 页', route: '/index'},
            {id: 1, text: '动 态', route: '/moments'},
            {id: 2, text: '所有文章', route: '/articles'},
            {id: 3, text: '资源共享', route: '/resources'}
          ]
          // siteList1: [
          //   {id: 6, text: '联系我们（课程对接）', route: '/index'}
          // ]
        }
      };
    },
    methods: {
      scrollTop () {
        window.scrollTo(0, 0);
      },
      toGuide () {
        window.open('https://github.com/Hungrated/innovation-platform-plus/blob/master/manual/innovation-platform.md');
      },
      toAbout () {
        window.open('https://github.com/Hungrated/innovation-platform-plus/blob/master/README.md');
      }
    }
  };
</script>

<style scoped lang="scss">
  @import "../../styles/footer";
</style>
