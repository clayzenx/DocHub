<template>
  <div class="content-container content-container_checkbox" v-bind:style="stylesToApply">
    <input
      v-model="inputValue"
      type="checkbox"
      class="checkbox"
      v-bind:disabled="disabled"
      v-on:change="updateInput">
  </div>
</template>

<script>
  import { getStylesToApply } from '../../lib/helpers';

  export default {
    props: {
      value: {
        type: Boolean,
        required: false,
        default: () => false
      },
      disabled: {
        type: Boolean,
        required: true
      },
      styles: {
        type: Object,
        required: true
      }
    },
    data() {
      return {
        inputValue: this.value
      };
    },
    computed: {
      stylesToApply() {
        return getStylesToApply(this.inputValue, this.styles);
      }
    },
    watch: {
      value() {
        this.inputValue = this.value;
      }
    },
    methods: {
      updateInput() {
        this.$emit('input', this.inputValue);
      }
    }
  };
</script>

<style scoped>
.checkbox {
  cursor: pointer;
  width: 18px;
  height: 18px;
}

.checkbox:focus {
  outline-color: var(--color-primary);
}
</style>
