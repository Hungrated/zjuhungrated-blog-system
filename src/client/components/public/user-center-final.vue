<template>
  <div id="final-container" class="m-final">
    <div class="m-final exist" v-if="cswkData.cswk_src !== null">
      <em>期末作业已上传</em>&emsp;
      <div>
        <Button type="success"
                size="small"
                @click="downloadFile(cswkData.cswk_src)">下 载
        </Button>
        <Upload class="button"
                action="#"
                accept="application/zip"
                :show-upload-list="false"
                :data="uploadData"
                :before-upload="handleUpload">
          <Button type="ghost"
                  size="small"
                  :disabled="cswkData.rate !== null">更 改
          </Button>
        </Upload>
        <Button type="error"
                size="small"
                :disabled="cswkData.rate !== null"
                @click="deleteFile(cswkData.cswk_src)">删 除
        </Button>
      </div>
      <span class="m-final rate" v-model="cswkData">
        <strong>
          当前选课号：<br>
          <span>{{cswkData.class_id}}</span>
        </strong>
        <strong>
          评 级：&nbsp;
          <span v-if="cswkData.rate">{{cswkData.rate}}</span>
          <em v-else>未 评</em>
        </strong>
        <strong>
          评 语：&nbsp;
          <span v-if="cswkData.remark">{{cswkData.remark}}</span>
          <em v-else>未 评</em>
        </strong>
      </span>
    </div>
    <div class="m-final none" v-else>
      <em>期末作业未上传</em>&emsp;
      <span>
        <Upload class="button"
                action="#"
                accept="application/zip"
                :data="uploadData"
                :before-upload="handleUpload">
          <Button type="dashed" icon="ios-cloud-upload-outline">选择并上传</Button>
        </Upload>
      </span>
    </div>
  </div>
</template>

<script>
  import { Button, Upload } from 'iview';

  export default {
    name: 'user-center-final',
    components: {
      Button, Upload
    },
    data () {
      return {
        uploadData: {
          file: null
        },
        cswkData: {
          cswk_src: null
        },
        uploadConfig: {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      };
    },
    methods: {
      refreshData () {
        let _this = this;
        this.$ajax.post('/api/final/query', {}).then(function (res) {
          _this.cswkData = res.data[0];
        }).catch(function (e) {
          console.log(e);
        });
      },
      handleUpload (file) {
        if (this.cswkData.rate) {
          this.$Message.info('教师已进行过评分，无法更改上传文件');
          return false;
        } else {
          this.uploadData.file = file;
          this.submitFile();
          return false;
        }
      },
      submitFile () {
        let _this = this;
        let formData = new FormData();
        formData.append('file', this.uploadData.file);
        this.$ajax.post('/api/final/upload', formData, this.uploadConfig).then(function (res) {
          _this.$Message.success(res.data.msg);
          _this.refreshData();
        }).catch(function (e) {
          console.log(e);
        });
      },
      downloadFile (url) {
        let a = document.getElementById('fileDownloadTmpFrame');
        a.src = url;
        this.$Message.success('文件下载成功');
      },
      deleteFile (url) {
        let _this = this;
        this.$Modal.confirm({
          title: '确认删除期末作业',
          content: '确定删除当前已上传的期末作业？',
          onOk () {
            this.fileExists = false;
            this.$ajax.post('/api/final/delete', {
              cswk_src: url
            }).then(function (res) {
              _this.$Message.success(res.data.msg);
              _this.cswkData.cswk_src = null;
            }).catch(function (e) {
              console.log(e);
            });
          }
        });
      }
    },
    mounted () {
      this.refreshData();
    }
  };
</script>

<style scoped lang="scss">
  @import "../../styles/user-center-final";
</style>
