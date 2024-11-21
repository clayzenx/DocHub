<template>
  <div 
    class="content-container"
    v-bind:style="stylesToApply">
    {{ value }}
  </div>
</template>

<script>
  import { getStylesToApply } from '../../lib/helpers';

  export default {
    props: {
      value: {
        type: [Number, String],
        required: false,
        default: () => ''
      },
      styles: {
        type: Object,
        required: true
      }
    },

    computed: {
      stylesToApply() {
        const styles = getStylesToApply(this.value, this.styles);
        return styles;
      }
    }

  };
</script>

<style scoped>

</style>
