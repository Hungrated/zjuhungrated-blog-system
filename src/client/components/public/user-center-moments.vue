<template>
  <div id="moments-container" class="s-moments-container">
    <Timeline>
      <p v-if="momentList.length === 0" style="text-align: center">暂无动态哦</p>
      <div class="s-moment-item-container" v-else>
        <TimelineItem v-for="moment in momentList" :key="moment.moment_id">
          <div v-if="moment.type === 'planmod'" class="s-moment-item">
            <div class="s-moment-item-time">{{ getTime(moment.created_at) }}</div>
            <div>
              <Icon type="ios-lightbulb"></Icon>&nbsp;
              <strong>更新计划：</strong>
              <span>{{moment.desc}}</span>
            </div>
            <div>
              <strong class="s-moment-item-status">{{ moment.extras.status }}</strong>
            </div>
          </div>
          <div v-if="moment.type === 'article'" class="s-moment-item">
            <div class="s-moment-item-time">{{ getTime(moment.created_at) }}</div>
            <div>
              <Icon type="document-text"></Icon>&nbsp;&nbsp;
              <strong>发布文章：</strong>
              <span>{{moment.desc}}</span>&emsp;|&emsp;
              <a :href="'/#' + moment.extras.href" @click="scrollTop">查 看</a>
            </div>
          </div>
          <div v-if="moment.type === 'resource'" class="s-moment-item">
            <div class="s-moment-item-time">{{ getTime(moment.created_at) }}</div>
            <div>
              <Icon type="android-folder-open"></Icon>&nbsp;
              <strong>上传资源：</strong>
              <span>{{moment.desc}}</span>&emsp;|&emsp;
              <a :href="moment.extras.url">下 载</a>
            </div>
          </div>
        </TimelineItem>
      </div>
    </Timeline>
  </div>
</template>

<script>
  import { Timeline, TimelineItem, Icon } from 'iview';

  export default {
    name: 'user-center-moments',
    components: {
      Timeline, TimelineItem, Icon
    },
    data () {
      return {
        momentList: []
      };
    },
    methods: {
      scrollTop () {
        window.scrollTo(0, 0);
      },
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
      fetchMoments () {
        let _this = this;
        this.$ajax.get('/api/user/token').then(function (res) {
          _this.$ajax.get(`/api/moment/fetch?sid=${res.data.school_id}&limit=40`).then(function (res) {
            _this.momentList = res.data;
            for (let i = 0; i < res.data.length; i++) {
              _this.momentList[i].extras = JSON.parse(res.data[i].extras);
            }
          }).catch(function (e) {
            console.log(e);
          });
        }).catch(function (e) {
          console.log(e);
        });
      }
    },
    mounted () {
      this.fetchMoments();
    }
  };
</script>

<style scoped lang="scss">
  @import '../../styles/user-center-moments';
</style>
