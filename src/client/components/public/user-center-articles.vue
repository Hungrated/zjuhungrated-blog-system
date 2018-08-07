<template>
  <div>
    <p v-if="!articleList.length" style="text-align: center">暂无文章哦</p>
    <div v-else class="m-unit" v-for="article in articleList" :key="article.blog_id">
      <span class="m-unit title">
       <Button type="text" size="large" @click="revealDetails(article.blog_id)">
         <strong>{{article.title}}</strong>
       </Button>
      </span>
      <span class="m-unit info">
        <Icon type="ios-clock-outline"></Icon>&nbsp;{{article.publishTime}}&emsp;
      </span>
    </div>
  </div>
</template>

<script>
  import { Button, Icon } from 'iview';

  export default {
    name: 'user-center-articles',
    components: {
      Button, Icon
    },
    data () {
      return {
        articleList: []
      };
    },
    methods: {
      getStuArticleList () {
        let _this = this;
        this.$ajax.get('/api/user/token').then(function (res) {
          _this.$ajax.post('/api/blog/query?limit=10', {
            request: res.data.school_id,
            carousel: false
          }).then(function (res) {
            _this.articleList = res.data.articleList;
          }).catch(function (e) {
            console.log(e);
          });
        }).catch(function (e) {
          console.log(e);
        });
      },
      revealDetails (index) {
        this.$router.push('/articles/details?index=' + index);
        window.scrollTo(0, 0);
      }
    },
    mounted () {
      this.getStuArticleList();
    }
  };
</script>

<style scoped lang="scss">
  @import "../../styles/user-center-articles";
</style>
