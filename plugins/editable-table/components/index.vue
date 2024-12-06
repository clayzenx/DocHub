<template>
  <div class="plugin">
    <template v-if="!isDataLoaded">
      <v-alert> Тружусь... </v-alert>
      <v-skeleton-loader type="table-row@6" />
    </template>

    <v-alert v-else-if="errorMessage" class="error" icon="warning">
      {{ errorMessage }}
    </v-alert>

    <dh-table
      v-else
      v-bind:table-data="tableData"
      v-bind:headers="Object.values(tableHeaders)"
      v-bind:direction="profile.direction === 'ttb' ? 'ttb' : 'ltr'"
      v-bind:selection="profile.selection === true"
      v-bind:page-size="profile.page_size ?? 20"
      v-bind:filtration="profile.filtration ?? true"
      v-on:on-save="saveTableToFiles" />

    <v-dialog v-if="isBackendMode" v-model="isDialogOpen" max-width="400" v-bind:persistent="!commitStatus">
      <spinner v-if="commitStatus === null" />
      <v-alert v-else-if="commitStatus === 201" type="success" class="alert">
        Данные сохранены
      </v-alert>
      <v-alert v-else type="error" class="alert">
        Ошибка при сохранении данных в репозиторий
      </v-alert>
    </v-dialog>
  </div>
</template>

<script>
  import yaml from 'yaml';
  import env, { Plugins } from '@front/helpers/env';
  import { mergeHeaders, parseSelectOptions, prepareTableData } from '../lib/helpers';
  import Table from './Table/Table.vue';
  import Spinner from '@/src/frontend/components/Controls/Spinner.vue';

  export default {
    components: {
      'dh-table': Table,
      'spinner': Spinner
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
        isBackendMode: env.isBackendMode(),
        isDataLoaded: false,
        tableData: {},
        tableHeaders: [],
        errorMessage: null,
        commitStatus: null,
        isDialogOpen: false
      };
    },

    watch: {
      isDialogOpen(cur, prev) {
        if (cur === false && prev === true) {
          this.commitStatus = null;
        }
      }
    },

    mounted() {
      this.initTable();
    },

    methods: {
      async initTable() {
        const data = await this.loadSourceData();

        if (this.errorMessage) {
          this.isDataLoaded = true;
          return;
        }

        const { body, headers: sourceHeaders } = data;

        if (!this.profile.headers?.length && !sourceHeaders?.length) {
          this.errorMessage = 'Не заполнены заголовки (headers) для таблицы';
          this.isDataLoaded = true;
          return;
        }

        const headers = mergeHeaders(this.profile.headers, sourceHeaders);
        const formatedHeaders = await this.formatHeaders(headers);

        if (this.errorMessage) {
          this.isDataLoaded = true;
          return;
        }

        const tableData = prepareTableData(body, formatedHeaders);

        this.tableData = tableData;
        this.tableHeaders = formatedHeaders;
        this.isDataLoaded = true;
      },

      async formatHeaders(rawHeaders) {
        let formatedHeaders = {};

        for (let i = 0; i < rawHeaders.length; i++) {
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
            styles
          } = rawHeaders[i];

          if (!value) {
            this.errorMessage = 'Не задано значение идентификатора (value) для headers';
            return;
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
              this.errorMessage = `Не заполнены опции сохранения ("save") для редактируемой колонки ("editable: true"). Проверте значение "save" для "${value}"`;
              return;
            }
          }

          if (type === 'select' || type === 'multiple-select') {
            if (!options) {
              this.errorMessage = `Не указаны опции для селектора ("options"). Проверте значение "options" для ${value}`;
              return;
            }
            if (typeof options === 'string') {
              const jsonata = `
              (
                $."${options}"
              )`;
              try {
                const res = await this.pullData(jsonata);
                if (res === undefined) {
                  this.errorMessage = `Не удалось получить "${value}/options" по идентификатору ${jsonata}`;
                  return;
                }
                formatedHeaders[value].options = parseSelectOptions(res);
              } catch (err) {
                this.errorMessage = `JSONata запрос "${jsonata}" завершился с ошибкой. Проверте значение в "headers/${value}/options"`;
                // eslint-disable-next-line no-console
                console.log(err);
              }
            }
          }
        }

        return formatedHeaders;
      },

      async loadSourceData() {
        return await this.pullData()
          .then((data) => {
            if (!data.body) {
              throw new Error();
            }
            return data;
          })
          .catch((err) => {
            alert(err);
            this.errorMessage =
              'Не удалось загрузить данные для таблицы. Пожалуйста, проверте корректность заполнения "source"';
            // eslint-disable-next-line no-console
            console.log(err);
          });
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

.action-block {
  display: flex;
  gap: 8px;
}

.alert {
  margin: 0;
}
</style>
