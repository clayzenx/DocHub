<template>
  <div class="plugin">
    <dh-table
      v-if="!loading && activeDialog?.type !== 'error'"
      v-bind:table-data="tableData"
      v-bind:headers="Object.values(tableHeaders)"
      v-bind:table-options="tableOptions"
      v-bind:selected-rows="selectedRows"
      v-bind:on-select="onSelect">
      <v-tooltip v-if="tableOptions.editable" bottom>
        <template #activator="{ on, attrs }">
          <v-btn icon color="primary" fab class="action-button" v-bind="attrs" v-on:click="saveTableToFiles" v-on="on">
            <v-icon medium>
              mdi-content-save-outline
            </v-icon>
          </v-btn>
        </template>
        <span>Сохранить</span>
      </v-tooltip>

      <v-tooltip v-if="tableOptions.editable" bottom>
        <template #activator="{ on, attrs }">
          <v-btn
            icon
            color="primary"
            fab
            class="action-button"
            v-bind="attrs"
            v-on="on"
            v-on:click="activeDialog = { type: 'new-row' }">
            <v-icon medium>
              mdi-playlist-plus
            </v-icon>
          </v-btn>
        </template>
        <span>Добавить строку</span>
      </v-tooltip>

      <v-tooltip v-if="tableOptions.editable && tableOptions.selection" bottom>
        <template #activator="{ on, attrs }">
          <v-btn
            class="action-button"
            icon
            color="primary"
            v-bind:disabled="selectedRows.length === 0"
            fab
            v-bind="attrs"
            v-on:click="activeDialog = { type: 'mass-fill' }"
            v-on="on">
            <v-icon medium>
              mdi-playlist-edit
            </v-icon>
          </v-btn>
        </template>
        <span>Заполнить выделенное</span>
      </v-tooltip>
    </dh-table>

    <template v-if="activeDialog">
      <v-overlay v-model="activeDialog" />
      <v-dialog v-model="activeDialog" hide-overlay max-width="600" persistent>
        <v-alert v-if="activeDialog?.type === 'error'" class="alert" type="error">{{ activeDialog?.message }}</v-alert>
        <mass-fill
          v-if="activeDialog?.type === 'mass-fill'"
          v-bind:headers="Object.values(tableHeaders)"
          v-on:click-save="massDataFill"
          v-on:click-cancel="activeDialog = null" />
        <new-row
          v-else-if="activeDialog?.type === 'new-row'"
          v-bind:table-rows="Object.keys(tableData)"
          v-on:click-save="createNewRow"
          v-on:click-cancel="activeDialog = null" />

        <spinner v-else-if="activeDialog?.type === 'loading'" />
      </v-dialog>
    </template>
  </div>
</template>

<script>
  import yaml from 'yaml';
  import env, { Plugins } from '@front/helpers/env';
  import Spinner from '@front/components/Controls/Spinner.vue';
  import Table from './Table/Table.vue';
  import MassDataFillCard from './MassDataFillCard.vue';
  import NewRowCard from './NewRowCard.vue';

  import {
    mergeHeaders,
    parseSelectOptions,
    prepareTableData
  } from '../lib/helpers';

  export default {
    components: {
      Spinner,
      'dh-table': Table,
      'mass-fill': MassDataFillCard,
      'new-row': NewRowCard
    },
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
    data() {
      return {
        loading: true,

        tableData: {},
        tableHeaders: [],

        selectedRows: [],

        activeDialog: null,

        tableOptions: {
          selection: this.profile.selection === true,
          filtration: this.profile.filtration ?? true,
          direction: this.profile.direction ?? 'ltr',
          editable: null,
          maxWidth: 'auto',
          pageSize: this.profile.page_size ?? 20
        }

      };
    },

    mounted() {
      this.initTable();
    },

    methods: {
      createNewRow(rowID) {
        this.tableData = {...this.tableData, [rowID]: {}};
        this.activeDialog = null;
      },

      massDataFill(updatedColumns, data) {
        this.selectedRows.forEach(rowID => {
          updatedColumns.forEach((headerID) => {
            if (data[headerID] && typeof data[headerID] === 'object') {
              if (Array.isArray(data[headerID])) {
                this.tableData[rowID][headerID] = [...data[headerID]];
              } else {
                this.tableData[rowID][headerID] = { ...data[headerID] };
              }
            } else {
              this.tableData[rowID][headerID] = data[headerID];
            }
          });
        });

        this.activeDialog = null;
      },

      onSelect(value) {
        this.selectedRows = value;
      },

      async initTable() {
        this.loading = true;

        // ************************** SOURCE DATA **************************
        let sourceData = await this.pullData();

        if (!sourceData || !sourceData?.body) {
          let message = 'Не удалось загрузить данные для таблицы. Пожалуйста, проверте корректность заполнения "source".';
          if (sourceData && !sourceData?.body) {
            message += 'Выражение в "source" должно вернуть объект со свойством "body".';
          }
          this.activeDialog = { type: 'error', message };
          return this.loading = false;
        }

        const { body, headers: sourceHeaders } = sourceData;

        // ************************** HEADERS **************************
        if (!this.profile.headers?.length && !sourceHeaders?.length) {
          this.activeDialog = {
            type: 'error',
            message: 'Не заполнены заголовки (headers) для таблицы'
          };
          return this.loading = false;
        }

        const headers = mergeHeaders(this.profile.headers, sourceHeaders);
        let formatedHeaders = {};

        let marginCount = 0;

        for (let i = 0; i < headers.length; i++) {
          const {
            value,
            text = value,
            type = 'text',
            editable = false,
            sortable = true,
            filterable = true,
            options,
            save,
            width = 'auto',
            pinned = false,
            style = {},
            styles = {}
          } = headers[i];

          if (!value) {
            this.activeDialog = {
              type: 'error',
              message: `Не задано значение идентификатора (value) для headers #${i + 1}`
            };
            return this.loading = false;
          }

          formatedHeaders[value] = {
            headerID: value,
            text,
            type,
            disabled: !editable,
            sortable,
            options,
            save,
            filterable: this.profile.filtration === false ? false : filterable,
            width,
            pinned,
            styles: {
              _default: style,
              ...styles
            }
          };

          if (editable) {
            if (!save || !save?.path || !save?.entity) {
              this.activeDialog = {
                type: 'error',
                message: `Не заполнены опции сохранения ("save") для редактируемой колонки ("editable: true"). Проверте значение "save" для "${value}"`
              };
              return this.loading = false;
            }
            this.tableOptions.editable = true;
          }

          const cellStyles = {};
          if (width) {
            cellStyles.minWidth = width;
          }

          if (pinned) {
            cellStyles.position = 'sticky';
            cellStyles.top = 0;
            cellStyles.left = `${marginCount}px`;
            cellStyles.zIndex = 6;
            cellStyles.outline = '1px solid var(--color-border)';
            marginCount += parseFloat(width);
          }

          formatedHeaders[value].cellStyles = cellStyles;

          if (formatedHeaders[value].filterable) {
            this.tableOptions.filtration = true;
          }

          const parsedWidth = parseFloat(width);
          if (width && parsedWidth > this.tableOptions.maxWidth) {
            this.tableOptions.maxWidth = parsedWidth;
          }

          if (type === 'select' || type === 'multiple-select') {
            if (!options) {
              this.activeDialog = {
                type: 'error',
                message: `Не указаны опции для селектора ("options"). Проверте значение "options" для ${value}`
              };
              return this.loading = false;
            }
            if (typeof options === 'string') {
              const jsonata = `
                (
                  $."${options}"
                )
              `;
              try {
                const res = await this.pullData(jsonata);
                if (!res) {
                  this.activeDialog = {
                    type: 'error',
                    message: `Не удалось получить "${value}/options" по идентификатору ${jsonata}`
                  };
                  return this.loading = false;
                }
                formatedHeaders[value].options = parseSelectOptions(res);
              } catch (err) {
                this.activeDialog = {
                  type: 'error',
                  message: `JSONata запрос "${jsonata}" завершился с ошибкой. Проверте значение в "headers/${value}/options"`
                };
                return this.loading = false;
              }
            }
          }
        }

        // ************************** DATA **************************
        const tableData = prepareTableData(body, formatedHeaders);

        this.tableData = tableData;
        this.tableHeaders = formatedHeaders;
        this.loading = false;
      },

      async getDataFromFile(path) {
        return this.getContent(path)
          .then((res) => {
            let data;
            if (env.isPlugin(Plugins.idea)) {
              data = res.data;
            } else {
              data = yaml.parse(res.data);
            }
            return data;
          })
          .catch((err) => {
            // eslint-disable-next-line no-console
            console.log(
              `Не удалось получить данные из файла "${path}". При сохранении, будет создан новый файл`,
              err
            );
            return {};
          });
      },

      mergeDataTable(slicedData) {
        for (let rowID in this.tableData) {
          const tableRow = this.tableData[rowID];

          for (let headerID in this.tableHeaders) {
            const { save, type } = this.tableHeaders[headerID];

            if (!save) {
              continue;
            }

            const { path, entity } = save;

            let tableValue = tableRow[headerID];

            if (type === 'checkbox' && !tableValue) {
              tableValue = false;
            } else if (
              !tableValue ||
              (Array.isArray(tableValue) && tableValue.length === 0)
            ) {
              delete slicedData[path]?.[entity]?.[rowID]?.[headerID];

              const originRow = slicedData[path]?.[entity]?.[rowID];
              if (originRow && Object.keys(originRow).length === 0) {
                delete slicedData[path]?.[entity]?.[rowID];
              }

              const entitySlice = slicedData[path]?.[entity];
              if (entitySlice && Object.keys(entitySlice).length === 0) {
                delete slicedData[path]?.[entity];
              }

              continue;
            }

            if (!slicedData[path]) {
              slicedData[path] = {};
            }

            if (!slicedData[path][entity]) {
              slicedData[path][entity] = {};
            }

            if (!slicedData[path][entity][rowID]) {
              slicedData[path][entity][rowID] = {};
            }

            slicedData[path][entity][rowID][headerID] = tableValue;
          }
        }
      },

      getPathList() {
        const pathList = new Set();
        for (let columnId in this.tableHeaders) {
          const { save } = this.tableHeaders[columnId];
          if (save) {
            pathList.add(save.path);
          }
        }
        return [...pathList];
      },

      async saveTableToFiles() {
        this.isDialogOpen = true;

        const pathList = this.getPathList();

        Promise.all(pathList.map((path) => this.getDataFromFile(path)))
          .then((slices) =>
            slices.map((slice, ind) => ({ [pathList[ind]]: slice }))
          )
          .then((slices) => Object.assign({}, ...slices))
          .then((slicedData) => {
            this.mergeDataTable(slicedData);

            for (let path in slicedData) {
              slicedData[path] = yaml.stringify(slicedData[path]);
            }

            return slicedData;
          })
          .then((updatedSlicedData) => {
            if (env.isBackendMode()) {
              return this.putContent(null, updatedSlicedData)
                .then(res => this.commitStatus = res.status)
                .catch(() => this.commitStatus = 400);
            }
            for (let path in updatedSlicedData) {
              this.putContent(path, updatedSlicedData[path]);
            }
          });
      }

    }
  };
</script>

<style scoped>
.plugin {
  --color-border: #e2e2e2;
  --color-bg-selected: #eee;
  --color-bg-filter: #eee;
  --color-bg-header: #3495db;
  --color-bg-cell: white;
  --color-primary: #3495db;
  --color-select: #d1ecff;
  --color-bg-icon: rgba(134, 134, 134);
  --width-size-select: 55px;
}

.action-button {
  width: 36px;
  height: 36px;
  transition: .25;
}

.action-button:hover {
  transform: scale(1.2);
}

.alert {
  margin: 0;
}
</style>
