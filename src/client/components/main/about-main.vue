<template>
  <div>
    {{msg}}
  </div>
</template>

<script>
  export default {
    name: 'about-main',
    data () {
      return {
        msg: '关于'
      };
    }
  };
</script>

<style scoped lang="scss">
  @import '../../styles/about';
</style>
