<template>
  <div id="app">
    <global-header></global-header>
    <global-main></global-main>
    <global-footer></global-footer>
    <BackTop :height="800" :duration="550"/>
  </div>
</template>

<script>
  import globalHeader from './components/global/global-header';
  import globalMain from './components/global/global-main';
  import globalFooter from './components/global/global-footer';
  import { BackTop } from 'iview';

  export default {
    name: 'app',
    components: {
      globalHeader, globalMain, globalFooter, BackTop
    },
    methods: {
      hasClass (ele, cls) {
        cls = cls || '';
        if (cls.replace(/\s/g, '').length === 0) return false;
        return new RegExp(' ' + cls + ' ').test(' ' + ele.className + ' ');
      },
      addClass (ele, cls) {
        if (!this.hasClass(ele, cls)) {
          ele.className = ele.className === '' ? cls : ele.className + ' ' + cls;
        }
      },
      removeClass (ele, cls) {
        if (this.hasClass(ele, cls)) {
          let newClass = ' ' + ele.className.replace(/[\t\r\n]/g, '') + ' ';
          while (newClass.indexOf(' ' + cls + ' ') >= 0) {
            newClass = newClass.replace(' ' + cls + ' ', ' ');
          }
          ele.className = newClass.replace(/^\s+|\s+$/g, '');
        }
      }
    },
    mounted () {
      let _this = this;
      window.onscroll = function () {
        let top = document.documentElement.scrollTop || window.pageYOffset || document.body.scrollTop;
        if (top > 45) {
          _this.addClass(document.getElementById('J_nav'), 'g-header-fixed');
        } else {
          _this.removeClass(document.getElementById('J_nav'), 'g-header-fixed');
        }
      };
    }
  };
</script>

<style scoped lang="scss">
  @import 'styles/base';

  #app {
    min-height: 100vh;
    background: url('./assets/bg.png') repeat-y;
    background-size: 100% auto;
    min-width: 900px !important;
    position: relative;
    padding-bottom: 245px;
  }
</style>
