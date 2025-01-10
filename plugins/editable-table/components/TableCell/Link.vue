<template>
  <div class="content-container" v-bind:style="stylesToApply">
    <template v-if="typeof value === 'string'">
      <d-c-link v-bind:href="value"> {{ value }} </d-c-link>
    </template>
    <div v-for="(link, ind) in value" v-else-if="Array.isArray(value)" v-bind:key="ind">
      <d-c-link v-bind:href="link.href">
        {{ link.text || link.href }}
      </d-c-link>
    </div>
    <template v-else-if="Boolean(value) && typeof value === 'object'">
      <d-c-link v-bind:href="value.href"> {{ value.text || value.href }} </d-c-link>
    </template>
  </div>
</template>

<script>
  import DCLink from '@front/components/Controls/DCLink.vue';
  import { getStylesToApply } from '../../lib/helpers';

  export default {
    components: {
      DCLink
    },
    props: {
      value: {
        type: [String, Array, Object],
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
