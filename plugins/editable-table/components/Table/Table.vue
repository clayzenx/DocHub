<template>
  <div class="wrapper">
    <div class="action-block">
      <slot />
      <v-tooltip v-if="!tableOptions.selection && tableOptions.filtration" bottom>
        <template #activator="{ on, attrs }">
          <v-btn icon fab class="action-button" v-bind="attrs" color="primary" v-on:click="onResetFilters" v-on="on">
            <v-icon medium>
              mdi-filter-off-outline
            </v-icon>
          </v-btn>
        </template>
        <span>Добавить строку</span>
      </v-tooltip>
    </div>

    <div v-if="tableOptions.direction === 'ltr'" key="ltr" class="scroll-container">
      <table v-if="tableOptions.direction === 'ltr'" key="ltr" class="table table_ltr">
        <!-- ***************************** HEADERS ROW ***************************** -->
        <tr class="table__row table__row_header">
          <!-- ************* SELECT ALL ************* -->
          <td v-if="tableOptions.selection" class="cell cell_header cell_select">
            <v-checkbox
              class="select"
              color="gray"
              v-bind:indeterminate="selectedRows.length === filteredAndSortedItems.length"
              v-bind:value="selectedRows.length > 0"
              v-on:change="onSelectAllRows" />
          </td>
          <!-- ************* HEADERS ************* -->
          <th
            v-for="{ headerID, text, sortable, cellStyles } in headers"
            v-bind:key="headerID"
            class="cell, cell_header"
            v-bind:style="cellStyles"
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
        <tr v-if="tableOptions.filtration" class="table__row">
          <!-- ************* RESET ************* -->
          <td v-if="tableOptions.selection" class="cell cell_filter cell_reset-filter">
            <v-btn icon v-on:click="onResetFilters">
              <v-icon medium>
                mdi-filter-off-outline
              </v-icon>
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
              cellStyles
            } in headers"
            v-bind:key="headerID"
            v-bind:width="width"
            class="cell cell_filter"
            v-bind:style="cellStyles">
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
            { table__row_selected: selectedRows.includes(rowID) },
          ]">
          <!-- ************* SELECT ITEM ************* -->
          <td v-if="tableOptions.selection" class="cell cell_body cell_select">
            <v-checkbox
              class="select"
              color="gray"
              v-bind:input-value="selectedRows.includes(rowID)"
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
              styles,
              cellStyles
            } in headers"
            v-bind:key="headerID"
            class="cell cell_body"
            v-bind:width="width"
            v-bind:style="cellStyles">
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

    <div v-if="tableOptions.direction === 'ttb'" key="ttb" class="scroll-container">
      <table v-if="tableOptions.direction === 'ttb'" key="ttb" class="table table_ttb">
        <!-- ***************************** SELECT ROW ***************************** -->
        <!-- ************* SELECT ALL ************* -->
        <tr v-if="tableOptions.selection" class="table__row">
          <td class="cell cell_select cell_header">
            <v-checkbox
              class="select"
              color="gray"
              v-bind:indeterminate="selectedRows.length === filteredAndSortedItems.length"
              v-bind:value="selectedRows.length > 0"
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
              { cell_selected: selectedRows.includes(rowID) },
            ]">
            <v-checkbox
              class="select"
              color="gray"
              v-bind:input-value="selectedRows.includes(rowID)"
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
            v-bind:class="['cell', 'cell_body', { cell_selected: selectedRows.includes(rowID) }]"
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

    <v-pagination
      v-if="filteredAndSortedItems.length > tableOptions.pageSize"
      v-model="currentPage"
      class="pagination"
      v-bind:length="numberOfPages"
      v-bind:total-visible="8" />
  </div>
</template>

<script>
  import { checkIsValueEmpty, getMultipleRowSorter } from '../../lib/helpers';
  import { SELECT_CHECKBOX_OPTIONS } from '../../lib/const';

  import TableCell from '../TableCell/index.vue';

  export default {
    components: {
      'table-cell': TableCell
    },

    props: {
      tableData: {
        type: Object,
        required: true
      },
      headers: {
        type: Array,
        required: true
      },
      tableOptions: {
        type: Object,
        required: true
      },
      onSelect: {
        type: Function,
        required: true
      },
      selectedRows: {
        type: Array,
        required: true
      }
    },

    data() {
      return {
        filters: {},
        selectCheckboxOptions: SELECT_CHECKBOX_OPTIONS,
        sortList: [],
        currentPage: 1
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
        const startIndex = (this.currentPage - 1) * this.tableOptions.pageSize;
        return this.filteredAndSortedItems.slice(
          startIndex,
          startIndex + this.tableOptions.pageSize
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
        return Math.ceil(this.filteredAndSortedItems.length / this.tableOptions.pageSize);
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
        const newValue = this.selectedRows.includes(rowID)
          ? this.selectedRows.filter((selected) => selected !== rowID)
          : [...this.selectedRows, rowID];
        this.onSelect(newValue);
      },

      onSelectAllRows() {
        const newValue =
          this.selectedRows.length === this.filteredAndSortedItems.length
            ? []
            : this.filteredAndSortedItems.map(([rowID]) => rowID);
        this.onSelect(newValue);
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
.wrapper {
  max-height: calc(100vh - 64px);
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.action-block {
  display: flex;
  gap: 12px;
}

.scroll-container {
  flex-grow: 1;
  overflow: auto;
  border-radius: 4px;
  padding: 0 8px 8px 0;
}

.scroll-container::-webkit-scrollbar-track {
  -webkit-box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.3);
  border-radius: 8px;
  background-color: #F5F5F5;
}

.scroll-container::-webkit-scrollbar {
  width: 12px;
  height: 12px;
  background-color: #F5F5F5;
}

.scroll-container::-webkit-scrollbar-thumb {
  border-radius: 8px;
  -webkit-box-shadow: inset 0 0 6px rgba(0, 0, 0, .3);
  background-color: #555;
}

.table {
  width: auto;
  border-collapse: collapse;
}

.pagination {
  height: 45px;
}

.select {
  margin-left: 7px;
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
  border: 1px solid var(--color-border);
  background-color: var(--color-bg-cell);
}

.cell_selected {
  background-color: var(--color-bg-selected);
}

.cell_header {
  position: relative;
  background-color: var(--color-bg-header);
  color: var(--color-bg-cell);
  border: 1px solid var(--color-border);
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

.action-button {
  width: 36px;
  height: 36px;
  transition: .25;
}
</style>
