<template>
  <div class="layout">
    <div class="wrapper">
      <div v-if="tableOptions.isEditable" class="action-block">
        <div class="action-block_edit">
          <v-btn color="primary" v-on:click="$emit('on-save')"> Сохранить </v-btn>
          <v-btn
            v-if="selection"
            class="button_massFilling"
            v-bind:disabled="selectedItems.length === 0"
            v-on:click="isDialogOpen = true">
            Заполнить выделенные
          </v-btn>
        </div>

        <v-btn v-if="!selection && tableOptions.isFiltareble" v-on:click="onResetFilters">
          Очистить фильтр
        </v-btn>
      </div>

      <div v-if="direction === 'ltr'" key="ltr" class="scroll-container">
        <table class="table table_ltr">
          <!-- ***************************** HEADERS ROW ***************************** -->
          <tr class="table__row table__row_header">
            <!-- ************* SELECT ALL ************* -->
            <td v-if="selection" class="cell cell_header cell_select">
              <v-checkbox
                class="select"
                color="gray"
                v-bind:indeterminate="selectedItems.length === filteredAndSortedItems.length"
                v-bind:value="selectedItems.length > 0"
                v-on:change="onSelectAllRows" />
            </td>
            <!-- ************* HEADERS ************* -->
            <th
              v-for="{ headerID, text, sortable } in headers"
              v-bind:key="headerID"
              class="cell, cell_header"
              v-bind:style="pinnedRowStyles[headerID]"
              v-on:click="() => (sortable ? onSetSort(headerID) : undefined)">
              <div class="table__header">
                {{ text }}
                <v-badge
                  v-if="sortMap[headerID]"
                  class="sort-badge"
                  color="primary"
                  v-bind:content="sortMap[headerID].priority + 1"
                  inline>
                  <v-icon
                    medium
                    v-bind:class="sortMap[headerID].direction === 'inc'
                      ? 'mdi mdi-arrow-up-bold'
                      : 'mdi mdi-arrow-down-bold'
                    "
                    v-bind:color="sortMap[headerID].direction === 'inc' ? 'green' : 'red'
                    " />
                </v-badge>
              </div>
            </th>
          </tr>

          <!-- ***************************** FILTER ROW ***************************** -->
          <tr v-if="tableOptions.isFiltareble" class="table__row">
            <!-- ************* RESET ************* -->
            <td v-if="selection" class="cell cell_filter cell_reset-filter">
              <v-btn icon v-on:click="onResetFilters">
                <v-icon medium>cancel</v-icon>
              </v-btn>
            </td>
            <!-- ************* FILTERS ************* -->

            <td
              v-for="{
                headerID,
                type,
                options,
                width,
                filterable,
              } in headers"
              v-bind:key="headerID"
              v-bind:width="width"
              class="cell cell_filter"
              v-bind:style="pinnedRowStyles[headerID]">
              <table-cell
                v-if="filterable && type === 'checkbox'"
                v-model="filters[headerID]"
                v-bind:type="'select'"
                v-bind:items="selectCheckboxOptions" />
              <table-cell
                v-else-if="filterable"
                v-model.trim="filters[headerID]"
                v-bind:type="type"
                v-bind:items="options" />
            </td>
          </tr>

          <!-- ***************************** ITEMS ROW ***************************** -->
          <tr
            v-for="([rowID, row]) in filteredAndSortedItemsSlice"
            v-bind:key="rowID"
            v-bind:class="[
              'table__row',
              { table__row_selected: selectedItems.includes(rowID) },
            ]">
            <!-- ************* SELECT ITEM ************* -->
            <td v-if="selection" class="cell cell_body cell_select">
              <v-checkbox
                class="select"
                color="gray"
                v-bind:input-value="selectedItems.includes(rowID)"
                v-on:change="() => onSelectRowItem(rowID)" />
            </td>

            <!-- ************* ITEMS ************* -->
            <td
              v-for="{
                headerID,
                type,
                width,
                disabled,
                options,
                styles
              } in headers"
              v-bind:key="headerID"
              class="cell cell_body"
              v-bind:width="width"
              v-bind:style="pinnedRowStyles[headerID]">
              <table-cell
                v-model.trim="row[headerID]"
                v-bind:type="type"
                v-bind:items="options"
                v-bind:disabled="disabled"
                v-bind:styles="styles" />
            </td>
          </tr>
        </table>
      </div>

      <div v-if="direction === 'ttb'" key="ttb" class="scroll-container">
        <table class="table table_ttb">
          <!-- ***************************** SELECT ROW ***************************** -->
          <!-- ************* SELECT ALL ************* -->
          <tr v-if="selection" class="table__row">
            <td class="cell cell_select cell_header">
              <v-checkbox
                class="select"
                color="gray"
                v-bind:indeterminate="selectedItems.length === filteredAndSortedItems.length"
                v-bind:value="selectedItems.length > 0"
                v-on:change="onSelectAllRows" />
            </td>
            <!-- ************* RESET FILTER ************* -->
            <td v-if="tableOptions.isFiltareble" class="cell cell_reset-filter cell_filter">
              <v-btn icon v-on:click="onResetFilters">
                <v-icon medium>cancel</v-icon>
              </v-btn>
            </td>
            <!-- ************* SELECTS ************* -->
            <td
              v-for="([rowID]) in filteredAndSortedItemsSlice"
              v-bind:key="rowID"
              v-bind:class="[
                'cell',
                'cell_select',
                { cell_selected: selectedItems.includes(rowID) },
              ]">
              <v-checkbox
                class="select"
                color="gray"
                v-bind:input-value="selectedItems.includes(rowID)"
                v-on:change="() => onSelectRowItem(rowID)" />
            </td>
          </tr>

          <!-- ***************************** HEADER AND ITEMS ***************************** -->
          <tr
            v-for="{
              headerID,
              text,
              type,
              options,
              disabled,
              filterable,
              sortable,
              styles
            } in headers"
            v-bind:key="headerID"
            class="table__row">
            <!-- ************* HEADERS ************* -->
            <th
              class="cell cell_header"
              v-bind:style="tableOptions.maxWidth"
              v-on:click="() => (sortable ? onSetSort(headerID) : undefined)">
              <div class="table__header">
                {{ text }}

                <v-badge
                  v-if="sortMap[headerID]"
                  class="sort-badge"
                  color="primary"
                  v-bind:content="sortMap[headerID].priority + 1"
                  inline>
                  <v-icon
                    medium
                    v-bind:class="sortMap[headerID].direction === 'inc'
                      ? 'mdi mdi-arrow-up-bold'
                      : 'mdi mdi-arrow-down-bold'
                    "
                    v-bind:color="sortMap[headerID].direction === 'inc' ? 'green' : 'red'
                    " />
                </v-badge>
              </div>
            </th>
            <!-- ************* FILTERS ************* -->
            <td v-if="tableOptions.isFiltareble" class="cell cell_filter" v-bind:style="tableOptions.maxWidth">
              <table-cell
                v-if="filterable && type === 'checkbox'"
                v-model="filters[headerID]"
                class="cell_checbox-selector"
                v-bind:type="'select'"
                v-bind:items="selectCheckboxOptions" />
              <table-cell
                v-else-if="filterable"
                v-model.trim="filters[headerID]"
                v-bind:type="type"
                v-bind:items="options" />
            </td>
            <!-- ************* ITEMS ************* -->
            <td
              v-for="([rowID, row]) in filteredAndSortedItemsSlice"
              v-bind:key="rowID"
              v-bind:class="['cell', 'cell_body', { cell_selected: selectedItems.includes(rowID) }]"
              v-bind:style="[tableOptions.maxWidth]">
              <table-cell
                v-model.trim="row[headerID]"
                v-bind:type="type"
                v-bind:items="options"
                v-bind:disabled="disabled"
                v-bind:styles="styles" />
            </td>
          </tr>
        </table>
      </div>

      <div class="footer">
        <v-pagination
          v-if="filteredAndSortedItems.length > pageSize"
          v-model="currentPage"
          v-bind:length="numberOfPages"
          v-bind:total-visible="7" />
      </div>
    </div>

    <v-alert v-if="isFilterActive && filteredAndSortedItems.length === 0">
      Ничего не найдено
    </v-alert>

    <v-dialog v-model="isDialogOpen" max-width="800">
      <mass-fill v-bind:headers="headers" v-on:click-save="massDataFill" v-on:click-cancel="isDialogOpen = false" />
    </v-dialog>
  </div>
</template>

<script>
  import { checkIsValueEmpty, getMultipleRowSorter } from '../../lib/helpers';

  import TableCell from '../TableCell/index.vue';
  import MassDataFillCard from '../MassDataFillCard.vue';
  import { SELECT_CHECKBOX_OPTIONS } from '../../lib/const';

  export default {
    components: {
      'table-cell': TableCell,
      'mass-fill': MassDataFillCard
    },
    props: {
      tableData: {
        type: Object,
        required: true
      },
      filtration: {
        type: Boolean,
        required: true
      },
      headers: {
        type: Array,
        required: true
      },
      direction: {
        type: String,
        required: true
      },
      selection: {
        type: Boolean,
        required: true
      },
      pageSize: {
        type: Number,
        required: true
      }
    },

    data() {
      return {
        currentPage: 1,
        filters: {},
        selectCheckboxOptions: SELECT_CHECKBOX_OPTIONS,
        isDialogOpen: false,
        selectedItems: [],
        sortList: []
      };
    },
    computed: {
      items() {
        return Object.entries(this.tableData);
      },
      filteredItems() {
        return this.isFilterActive
          ? this.items.filter((row) => this.checkRowIsPassedFiltering(row))
          : this.items;
      },
      filteredAndSortedItems() {
        return this.sortList.length > 0
          ? [...this.filteredItems].sort(getMultipleRowSorter(this.sortList))
          : this.filteredItems;
      },
      filteredAndSortedItemsSlice() {
        const startIndex = (this.currentPage - 1) * this.pageSize;
        return this.filteredAndSortedItems.slice(
          startIndex,
          startIndex + this.pageSize
        );
      },

      isFilterActive() {
        for (let i = 0; i < this.headers.length; i++) {
          if (!checkIsValueEmpty(this.headers[i].headerID)) {
            return true;
          }
        }
        return false;
      },
      numberOfPages() {
        return Math.ceil(this.filteredAndSortedItems.length / this.pageSize);
      },
      sortMap() {
        const result = {};
        this.sortList.forEach((sorter, index) => {
          result[sorter.value] = { ...sorter, priority: index };
        });
        return result;
      },
      isSortActive() {
        return this.sortList.length > 0;
      },
      pinnedRowStyles() {
        const result = {};
        let marginCount = 0;

        this.headers.forEach(({ headerID, pinned, width }) => {
          const styles = {};

          if (width) {
            styles.minWidth = width;
          }

          if (pinned) {
            styles.position = 'sticky';
            styles.top = 0;
            styles.left = `${marginCount}px`;
            styles.zIndex = 5;
            marginCount += parseFloat(width);
          }

          result[headerID] = styles;
        });

        return result;
      },
      tableOptions() {
        let hasFiltarebleColumn = false;
        let hasEditableColumn = false;
        let maxWidth = 0;

        this.headers.forEach(({ disabled, filterable, width }) => {
          if (filterable) {
            hasFiltarebleColumn = true;
          }
          if (!disabled) {
            hasEditableColumn = true;
          }

          const parsedWidth = parseFloat(width);

          if (width && parsedWidth > maxWidth) {
            maxWidth = parsedWidth;
          }
        });

        return {
          isEditable: hasEditableColumn,
          isFiltareble: this.filtration && hasFiltarebleColumn,
          maxWidth: maxWidth
        };
      }
    },

    watch: {
      filters: {
        deep: true,
        handler() {
          this.currentPage = 1;
        }
      }
    },

    methods: {
      onResetFilters() {
        this.filters = {};
      },

      massDataFill(updatedColumns, data) {
        this.isDialogOpen = false;
        this.changeSelectedRows(this.selectedItems, updatedColumns, data);
      },

      changeSelectedRows(selectedItems, updatedColumns, data) {
        selectedItems.forEach(rowID => {
          updatedColumns.forEach((headerID) => {
            this.tableData[rowID][headerID] = data[headerID];
          });
        });

      },

      // eslint-disable-next-line no-unused-vars
      checkRowIsPassedFiltering([_rowID, row]) {
        for (let i = 0; i < this.headers.length; i++) {
          const { headerID, type } = this.headers[i];

          const filterValue = this.filters[headerID];
          const currentValue = row[headerID];

          if (checkIsValueEmpty(filterValue)) {
            continue;
          }

          if (checkIsValueEmpty(currentValue)) {
            return false;
          }

          let isPassed;
          switch (type) {
            case 'text':
              isPassed = currentValue
                .toLowerCase()
                .includes(filterValue.toLowerCase());
              break;
            case 'select':
              isPassed = filterValue === currentValue;
              break;
            case 'multiple-select':
              isPassed = filterValue.every((current) =>
                currentValue.includes(current)
              );
              break;
            case 'checkbox':
              isPassed = filterValue === String(currentValue);
              break;
          }

          if (!isPassed) {
            return false;
          }
        }

        return true;
      },

      onSelectRowItem(rowID) {
        this.selectedItems = this.selectedItems.includes(rowID)
          ? this.selectedItems.filter((selected) => selected !== rowID)
          : [...this.selectedItems, rowID];
      },

      onSelectAllRows() {
        this.selectedItems =
          this.selectedItems.length === this.filteredAndSortedItems.length
            ? []
            : this.filteredAndSortedItems.map(([rowID]) => rowID);
      },

      onSetSort(headerID) {
        if (!this.sortMap[headerID]) {
          this.sortList = [
            ...this.sortList,
            {
              value: headerID,
              direction: 'inc'
            }
          ];
          return;
        }

        if (this.sortMap[headerID].direction === 'inc') {
          const index = this.sortMap[headerID].priority;
          this.sortList[index].direction = 'dec';
          return;
        }

        this.sortList = this.sortList.filter(({ value }) => value !== headerID);
      }
    }
  };
</script>

<style scoped>
.layout {
  padding: 6px 12px;
  display: flex;
  flex-direction: column;
  align-items: start;

  max-height: calc(100vh - 64px);
}

.wrapper {
  max-width: 100%;
  max-width: 100%;

  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.scroll-container {
  overflow: auto;
  border-radius: 6px;
  position: relative;
  padding-left: 1px;
}

.table {
  width: auto;
  border-collapse: collapse;
  margin: 4px;
}

.select {
  margin-left: 7px;
}

.action-block {
  padding: 8px 0;
  display: flex;
  justify-content: space-between;
}

.action-block_edit {
  display: flex;
  justify-content: space-between;
  gap: 8px;
}

.button_massFilling {
  margin-left: auto;
}

.table_ltr>>>.cell_select,
.table_ltr>>>.cell_reset-filter {
  width: var(--width-size-select);
  max-width: var(--width-size-select);
}

.table_ltr>>>.table__row:hover {
  background-color: var(--color-bg-selected);
}

.table__row:hover>.cell_body {
  background-color: var(--color-bg-selected);
}

.table__row_selected>.cell {
  background-color: var(--color-bg-selected);
}

.cell {
  height: 1em;
  outline: 1px solid var(--color-border);
  background-color: var(--color-bg-cell);
}

.cell_selected {
  background-color: var(--color-bg-selected);
}

.cell_header {
  position: relative;
  background-color: var(--color-bg-header);
  color: var(--color-bg-cell);
}

.table__header {
  min-height: 36px;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 4px;
}

.cell_filter {
  background-color: var(--color-bg-filter);
}

.cell_reset-filter {
  text-align: center;
}

.footer {
  align-self: center;
}
</style>
