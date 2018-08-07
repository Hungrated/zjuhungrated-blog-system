<template>
  <mavon-editor :value="value"
                :editable="false"
                :defaultOpen="'preview'"
                :subfield="false"
                :toolbarsFlag="false"
                :ishljs="true"/>
</template>
<script>
  export default {
    name: 'event-details',
    props: ['value']
  };
</script>
