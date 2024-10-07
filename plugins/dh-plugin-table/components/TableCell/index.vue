<template>
  <div class="table-cell">
    <dh-text
      v-if="type === 'text' && disabled" 
      v-bind:value="value"
      v-bind:styles="styles" />

    <dh-textarea 
      v-if="type === 'text' && !disabled" 
      v-bind:value="value" 
      v-bind:styles="styles"
      v-on:input="updateInput" />

    <dh-select
      v-else-if="type === 'select' || type === 'multiple-select'"
      v-bind:options="items"
      v-bind:multiple="type === 'multiple-select'"
      v-bind:disabled="disabled" 
      v-bind:value="value" 
      v-bind:styles="styles" 
      v-on:input="updateInput" />

    <dh-checkbox 
      v-else-if="type === 'checkbox'" 
      v-bind:value="value" 
      v-bind:disabled="disabled"
      v-bind:styles="styles"
      v-on:input="updateInput" />
  </div>
</template>

<script>
  import Textarea from './Textarea.vue';
  import Select from './Select.vue';
  import Checkbox from './Checkbox.vue';
  import Text from './Text.vue';

  export default {
    components: {
      'dh-textarea': Textarea,
      'dh-select': Select,
      'dh-checkbox': Checkbox,
      'dh-text': Text
    },
    props: {
      value: {
        type: null,
        required: true
      },
      type: {
        type: String,
        require: true,
        default: 'default'
      },
      items: {
        type: [Array],
        required: false,
        default: () => []
      },
      disabled: {
        type: Boolean,
        required: false,
        default: () => false
      },
      styles: {
        type: Object,
        required: false,
        default: () => ({})
      }
    },

    methods: {
      updateInput(value) {
        this.$emit('input', value);
      }
    }
  };
</script>

<style scoped>
.table-cell {
  --color-primary: #3495db;
  --color-border: #e2e2e2;
  --color-bg-icon: rgba(134, 134, 134);
  --color-bg-cell: white;
  --color-bg-filter: #eee;
  --color-select: #d1ecff;

  min-height: 60px;
  padding: 6px; 
  height: 100%; 
  width: 100%;
}

.content-container {
  padding: 4px 8px;
  min-width: 100%;
  min-height: 100%;
  border-radius: 4px;
}

.content-container_checkbox {
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
