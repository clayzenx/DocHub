<template>
  <textarea 
    ref="textarea" 
    class="textarea"
    v-bind:value="inputValue"
    v-bind:style="stylesToApply"
    v-on:input="updateInput" />
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

    data() {
      return {
        inputValue: this.value
      };
    },

    computed: {
      stylesToApply() {
        const styles = getStylesToApply(this.inputValue, this.styles);
        return styles;
      }
    },

    watch: {
      value() {
        this.inputValue = this.value;
      }
    },

    mounted() {
      this.updateHeight();
    },

    updated() {
      this.updateHeight();
    },

    methods: {
      updateHeight() {
        const textarea = this.$refs.textarea;
        textarea.style.height = 'auto';
        textarea.style.height = `${textarea.scrollHeight}px`;
      },

      updateInput(e) {
        this.inputValue = e.target.value;
        this.$emit('input', e.target.value);
        this.updateHeight();
      }
    }
  };
</script>

<style scoped>
.textarea {
  padding: 4px 8px;

  min-width: 100%;
  min-height: 100%;

  resize: none;

  border-radius: 4px;
  outline: 1px solid var(--color-border);
}

.textarea:focus {
  outline-width: 2px;
  outline-color: var(--color-primary);
}
</style>
