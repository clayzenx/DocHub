<template>
  <v-card>
    <div class="card-title">
      <v-checkbox
        label="Выбрать все"
        v-bind:indeterminate="selected.length === editableColumns.length"
        v-bind:value="selected.length > 0"
        color="gray"
        v-on:change="onSelectAll" />

      <div>
        Выбранные значения:
        <br>
        <strong>{{ selectedValuesString }}</strong>
      </div>
    </div>
    <div class="card-body">
      <template
        v-for="{ headerID, text, type, options, disabled } in headers">
        <div v-if="!disabled" v-bind:key="headerID" class="content">
          <v-checkbox
            v-model="selected"
            color="gray"
            v-bind:item="headerID"
            v-bind:value="headerID"
            v-bind:label="text" />
          <div class="cell">
            <table-cell
              v-model.trim="data[headerID]"
              v-bind:type="type"
              v-bind:items="options"
              v-on:input="onSelect(headerID)" />
          </div>
        </div>
      </template>
    </div>
    <v-card-actions>
      <v-spacer />
      <v-btn color="primary" v-on:click="onClickSave"> Сохранить </v-btn>
      <v-btn color="gray" v-on:click="onClickCancel"> Отменить </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script>
  import TableCell from './TableCell';

  export default {
    components: {
      'table-cell': TableCell
    },
    props: {
      headers: {
        type: Array,
        required: true
      }
    },
    data() {
      return {
        data: {},
        selected: []
      };
    },
    computed: {
      editableColumns() {
        return this.headers
          .filter(({disabled}) => !disabled)
          .map(({headerID}) => headerID);
      },
      headerIdToTextMap() {
        const map = {};
        this.headers.forEach(
          ({ headerID, text }) => (map[headerID] = text)
        );
        return map;
      },
      selectedValuesString() {
        return this.selected.length === 0
          ? 'пусто...'
          : this.selected.map((id) => this.headerIdToTextMap[id]).join(', ');
      }
    },
    methods: {
      onSelect(item) {
        if (!this.selected.includes(item)) {
          this.selected = [...this.selected, item];
        }
      },
      onSelectAll() {
        this.selected =
          this.selected.length < this.editableColumns.length
            ? [...this.editableColumns]
            : [];
      },
      resetData() {
        this.selected = [];
        this.data = {};
      },
      onClickSave() {
        this.$emit('click-save', this.selected, this.data);
        this.resetData();
      },
      onClickCancel() {
        this.$emit('click-cancel');
        this.resetData();
      }
    }
  };
</script>

<style scoped>
.card-title {
  padding: 4px 16px;
}

.card-body {
  max-height: 600px;
  overflow: auto;

  border-bottom: 2px solid #e2e2e2;
  border-top: 2px solid #e2e2e2;

  padding: 16px 16px 32px;

  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.cell {
  height: 100%;

  display: flex;
  justify-content: center;
  align-items: center;
}
.content {
  display: flex;
  flex-direction: column;
}
</style>
