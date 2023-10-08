<template>
  <box>
    <div v-html="svg" />
  </box>
</template>

<script>
  import mermaid from 'mermaid';
  import mustache from 'mustache';
  import mindmap from '@mermaid-js/mermaid-mindmap';
  import crc16 from '@global/helpers/crc16';
  
  import requests from '@front/helpers/requests';
  import href from '@front/helpers/href';

  import DocMixin from './DocMixin';

  /*
  mermaid.initialize({
    startOnLoad:true
  });
  */

  export default {
    name: 'DocMermaid',
    mixins: [DocMixin],
    data() {
      return {
        svg: null
      };
    },
    mounted() {
      if (!window.as_mindmap) {
        mermaid.registerExternalDiagrams([mindmap]).then(() => {
          window.as_mindmap = true;
        });
      }
    },
    methods: {
      refresh() {
        // Получаем шаблон документа
        this.sourceRefresh().then(() => {
          requests.request(this.url).then(({ data }) => {
            const id = crc16(data);
            let source = this.isTemplate
              ? mustache.render(data, this.source.dataset)
              : data;
            const cb = (svgGraph) => {
              // Генерируем ссылки т.к. Mermaid для C4 Model отказывается это делать сам
              // eslint-disable-next-line no-useless-escape
              this.svg = svgGraph.replace(/\!\[([^\]]*)\]\(([^\)]*)\)/g, (match, text, url)=> {
                return `<a href="${encodeURI(url)}">${text}<a>`;
              })
                + `<!-- ${Date.now()} -->`; // Без соли не работает ререндеринг тех же данных

              this.$nextTick(() => href.elProcessing(this.$el));
            };
            mermaid.renderAsync(`buffer${id}`, source, cb);
          }).catch((e) => this.error = e);
        });
      }
    }
  };
</script>

<style>
</style>
