<template>
  <div class="plugin">
    <h2>ID: {{ templateName }}</h2>
    <v-btn color="primary" v-on:click="onSave">Сохранить шаблон</v-btn>

    <v-overlay v-if="loading || error">
      <spinner v-if="loading" />
      <v-alert v-else class="alert" type="error" width="600">{{ error }}</v-alert>
    </v-overlay>
  </div>
</template>

<script>
  import Spinner from '@front/components/Controls/Spinner.vue';
  import ExcelJS from 'exceljs';
  import { Book } from '../lib/utils';

  export default {
    components: {
      Spinner
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
        data: {},
        loading: false,
        error: null
      };
    },

    computed: {
      templateName() {
        const path = this.profile.$base.split('/');
        return path[path.length - 1];
      }
    },

    mounted() {
      this.init();
    },

    methods: {
      async init() {
        this.loading = true;
        const list = [];
        this.profile.pages.forEach(page => {
          if (page.components) {
            page.components.forEach(async(component) => {
              if (component.source) {
                list.push(this.pullData(component.source).then(res => {
                  if (typeof res === 'object' && res.body) {
                    this.data[component.name] = res;
                  } else {
                    this.error =
                      `JSONata выражение в поле 'source' для компонента ${component.name} должно вернуть объект с обязательным полем 'body' и опциональным полем 'headers'`;
                  }
                }));
              }
            });
          }
        });
        Promise.all(list)
          .catch((e) => {
            console.warn(e);
            this.error = 'Произошла непредвиденная ошибка, при получении данных для компонентов';
          })
          .finally(() => this.loading = false);
      },

      async onSave() {
        const book = new Book(ExcelJS, this.profile.options);

        this.profile.pages.forEach(page => {
          const { name, link, title, subtitle, description, components = [] } = page;
          const list = book.createPage(name);

          list.addLink(link);
          list.addTitle(title);
          list.addSubtitle(subtitle);
          list.addDescription(description);
          list.addEmptyRows(1);

          components.forEach(component => {
            if (component.type === 'template') {
              if (!this.profile?.templates?.[component.name]) {
                return this.error = `Не удалось получить шаблон (template) для компонента "${component.name}" на странице "${name}"`;
              }
              component = this.profile?.templates?.[component.name];
            }

            const { type, title, subtitle, description } = component;

            list.addTitle(title);
            list.addSubtitle(subtitle);
            list.addDescription(description);

            if (type === 'table') {
              list.addComponentTable(component, this.data[component.name]);
            } else if (type === 'rows') {
              list.addComponentRows(component);
            }

            list.addEmptyRows(1);
          });
        });

        !this.error && book.download();
      }
    }
  };
</script>

<style scoped>
.plugin {
  padding: 12px;
}
</style>
