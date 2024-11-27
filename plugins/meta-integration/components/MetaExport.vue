<template>
  <div class="wrapper">
    <v-btn color="primary" v-on:click="postData">export to META</v-btn>
  </div>
</template>

<script>
  import yaml from 'yaml';

  export default {
    props: {
      profile: {
        type: Object,
        required: true
      },
      getContent: {
        type: Function,
        required: true
      },
      putContent: {
        type: Function,
        default: null,
        required: false
      },
      pullData: {
        type: Function,
        required: true
      }
    },

    methods: {
      postData() {
        this.pullData().then(res => {
          const ID = res?.digitalArchitecture[0]?.yamlId;
          const yamledData = yaml.stringify(res);
          window.$PAPI.postDataInMeta(ID, this.profile.url, yamledData)
            .then(res => {
              this.putContent(`response/${ID}.yaml`, res.data);
            });
        });
      }
    }

  };
</script>

<style scoped>
.wrapper {
  padding: 16px 0;

  display: flex;
}


</style>
