<template>
  <v-card class="card">
    <v-text-field
      v-model="value"
      class="card__input"
      label="Введите идентификатор"
      v-bind:rules="rules"
      hide-details="auto" />
    <v-card-actions>
      <v-spacer />
      <v-btn color="primary" v-bind:disabled="hasError" v-on:click="onClickSave"> Сохранить </v-btn>
      <v-btn color="gray" v-on:click="onClickCancel"> Отменить </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script>
  export default {
    props: {
      tableRows: {
        type: Array,
        required: true
      }
    },
    data() {
      return {
        value: '',
        rules: [
          value => !!value?.trim() || 'Не может быть пустым.',
          value => !this.tableRows.includes(value.trim()) || 'Строка с таким идентификатором уже существует'
        ]
      };
    },
    computed: {
      hasError() {
        for(let i = 0; i < this.rules.length; i++) {
          const rule = this.rules[i];
          if(!(rule(this.value) === true)) {
            return true;
          } 
        }
        return false;
      }
    },

    methods: {
      onClickSave() {
        this.$emit('click-save', this.value);
      },
      onClickCancel() {
        this.$emit('click-cancel');
      }
    }
  };
</script>

<style scoped>
.card {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.card__input {
  min-height: 72px;
  max-height: 600px;
}
</style>
