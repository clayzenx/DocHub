<template>
  <div class="wrapper">
    <div v-if="isAuth === null" class="progress">
      <v-progress-circular v-bind:size="50" color="primary" indeterminate />
    </div>

    <div class="auth">
      <h4 class="auth__status" v-bind:class="{ 'auth__status_unauthorize': !isAuth }">
        {{ isAuth ? "Авторизация выполнена" : "Требуется авторизация" }}
      </h4>
      <a v-if="!isAuth" href="https://meta.sberbank.ru">
        Перейти в META
      </a>
    </div>

    <div v-if="isAuth" class="content">
      <v-text-field v-model="inputValue" label="GUID" />
      <v-btn color="primary" v-on:click="onGetData">import from meta</v-btn>
    </div>
  </div>
</template>

<script>
  import yaml from 'yaml';

  export default {
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
        inputValue: '',
        guid: null,
        imports: [],
        isAuth: null
      };
    },

    mounted() {
      this.checkAuthStatus(window.location.href);
    },

    methods: {
      checkAuthStatus(backlink) {
        window.$PAPI.checkIsAuth(backlink).then(res => this.isAuth = !!res);
      },

      // запрос к papi за архитектурой полученной с МЕТА
      onGetData() {
        window.$PAPI.getMetaIntegrationData(`${this.profile.url}/yaml?guid=${this.inputValue}`)
          .then(res => {
            this.guid = this.inputValue;
            this.inputValue = '';
            return res.data;
          })
          .then(rawYaml => {
            this.imports.push(`${this.guid}.yaml`);
            this.putContent(`${this.guid}.yaml`, rawYaml);
            return rawYaml;
          })
          .then(rawYaml => {
            const rawData = yaml.parse(rawYaml);

            this.profile.components.forEach(({ source, id }) => {
              const fileName = `${id}.yaml`;
              this.imports.push(fileName);

              this.pullDataFromContext(source, rawData).then(res => {
                const yamledData = yaml.stringify(res);
                this.putContent(fileName, yamledData);
              });
            });

            this.updateImport(this.imports);
          });
      },

      // Получить слайс из сырых данных полученных из МЕТА
      pullDataFromContext(source, context) {
        return this.pullData(source, this.profile, this.params, context);
      },

      // Добавляет новые импорты в root.yaml
      async updateImport(importList) {
        const { data } = await this.getContent('root.yaml');
        const newImportList = [...data.imports, ...importList];
        const uniqImports = new Set(newImportList);
        data.imports = [...uniqImports];
        const newRootData = yaml.stringify(data);
        this.putContent('root.yaml', newRootData);
      }
    }
  };
</script>

<style scoped>
.wrapper {
  padding: 8px 16px;

  display: flex;
  flex-direction: column;
  gap: 16px;
}

.progress {
  padding: 48px 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.auth__status {
  margin: 16px 0;
  color: green;
}

.auth__status_unauthorize {
  color: red;
}
</style>
