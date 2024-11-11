<template>
  <box style="overflow-x: auto;">
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

  import {diagram} from '@mermaid-js/mermaid-mindmap/dist/diagram-definition.ae1f7a29.js';
  import {diagram as architecture_diagram} from 'mermaid/dist/chunks/mermaid.core/architectureDiagram-AYX4OTIS';
  import {diagram as timeline_diagram} from 'mermaid/dist/chunks/mermaid.core/timeline-definition-27KQCCZ3';
  import {diagram as c4Diagram} from 'mermaid/dist/chunks/mermaid.core/c4Diagram-GPMAACGM';
  import {diagram as classDiagram} from 'mermaid/dist/chunks/mermaid.core/classDiagram-FEGYTUDG';
  import {diagram as classDiagram_v2} from 'mermaid/dist/chunks/mermaid.core/classDiagram-v2-R65JCUOM';
  import {render as dagreDiagram} from 'mermaid/dist/chunks/mermaid.core/dagre-SWNTG5WE';
  import {diagram as diagramDiagram} from 'mermaid/dist/chunks/mermaid.core/diagram-NZMEDLQF';
  import {diagram as erDiagram} from 'mermaid/dist/chunks/mermaid.core/erDiagram-WO52GFNT';
  import {diagram as flowDiagram} from 'mermaid/dist/chunks/mermaid.core/flowDiagram-TSWR6T2D';
  import {diagram as ganttDiagram} from 'mermaid/dist/chunks/mermaid.core/ganttDiagram-FAOCOTIY';
  import {diagram as gitGraphDiagram} from 'mermaid/dist/chunks/mermaid.core/gitGraphDiagram-5C7YHVU6';
  import {diagram as infoDiagram} from 'mermaid/dist/chunks/mermaid.core/infoDiagram-P5D6MX3V';
  import {diagram as journeyDiagram} from 'mermaid/dist/chunks/mermaid.core/journeyDiagram-UIGPPNLY';
  import {diagram as kanbanDiagram} from 'mermaid/dist/chunks/mermaid.core/kanban-definition-KMT3NSR2';
  import {diagram as mindmap_diagram} from 'mermaid/dist/chunks/mermaid.core/mindmap-definition-R7LC4OIY';
  import {diagram as pieDiagram} from 'mermaid/dist/chunks/mermaid.core/pieDiagram-BLWKPB35';
  import {diagram as quadrantDiagram} from 'mermaid/dist/chunks/mermaid.core/quadrantDiagram-QXWEEFXS';
  import {diagram as requirementDiagram} from 'mermaid/dist/chunks/mermaid.core/requirementDiagram-XAUNFCZY';
  import {diagram as sankeyDiagram} from 'mermaid/dist/chunks/mermaid.core/sankeyDiagram-LVV36NHA';
  import {diagram as sequenceDiagram} from 'mermaid/dist/chunks/mermaid.core/sequenceDiagram-D25TJ2OB';
  import {diagram as stateDiagram} from 'mermaid/dist/chunks/mermaid.core/stateDiagram-GNSP7T6Y';
  import {diagram as stateDiagram_v2} from 'mermaid/dist/chunks/mermaid.core/stateDiagram-v2-HP6YRVRG';
  import {diagram as timelineDiagram} from 'mermaid/dist/chunks/mermaid.core/timeline-definition-27KQCCZ3';
  import {diagram as xychartDiagram} from 'mermaid/dist/chunks/mermaid.core/xychartDiagram-MYLB5AYS';

  /*
  mermaid.initialize({
    startOnLoad:true
  });
  */


  /* костыль, но вебпак я не поборол.
  * динамически подгружаемые модули засовывает в чанки
  * а загружать чанки наши плагины не умеют
  * поэтому прописал нужные динамические jsники статически
  */
  function never_used() {
    // eslint-disable-next-line no-console
    console.log(diagram);
    // eslint-disable-next-line no-console
    console.log(timeline_diagram);
    // eslint-disable-next-line no-console
    console.log(architecture_diagram);
    // eslint-disable-next-line no-console
    console.log(c4Diagram);
    // eslint-disable-next-line no-console
    console.log(classDiagram);
    // eslint-disable-next-line no-console
    console.log(classDiagram_v2);
    // eslint-disable-next-line no-console
    console.log(dagreDiagram);
    // eslint-disable-next-line no-console
    console.log(diagramDiagram);
    // eslint-disable-next-line no-console
    console.log(erDiagram);
    // eslint-disable-next-line no-console
    console.log(flowDiagram);
    // eslint-disable-next-line no-console
    console.log(ganttDiagram);
    // eslint-disable-next-line no-console
    console.log(gitGraphDiagram);
    // eslint-disable-next-line no-console
    console.log(infoDiagram);
    // eslint-disable-next-line no-console
    console.log(journeyDiagram);
    // eslint-disable-next-line no-console
    console.log(kanbanDiagram);
    // eslint-disable-next-line no-console
    console.log(mindmap_diagram);
    // eslint-disable-next-line no-console
    console.log(pieDiagram);
    // eslint-disable-next-line no-console
    console.log(quadrantDiagram);
    // eslint-disable-next-line no-console
    console.log(requirementDiagram);
    // eslint-disable-next-line no-console
    console.log(sankeyDiagram);
    // eslint-disable-next-line no-console
    console.log(sequenceDiagram);
    // eslint-disable-next-line no-console
    console.log(stateDiagram);
    // eslint-disable-next-line no-console
    console.log(stateDiagram_v2);
    // eslint-disable-next-line no-console
    console.log(timelineDiagram);
    // eslint-disable-next-line no-console
    console.log(xychartDiagram);
  }

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
      load_all_dependencies() {
        never_used();
      },
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
            const drawDiagram = async function() {
              const { svg } = await mermaid.render(`buffer${id}`, source);
              cb(svg);
            };
            drawDiagram();
          }).catch((e) => this.error = e);
        });
      }
    }
  };
</script>

<style>
</style>
