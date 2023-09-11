<template>
  <svg
    ref="zoomAndPan"
    class="dochub-schema"
    xmlns="http://www.w3.org/2000/svg"
    xmlns:xlink="http://www.w3.org/1999/xlink"
    contentstyletype="text/css"
    preserveAspectRatio="none"
    version="1.1"
    v-bind:viewBox="viewBox"
    encoding="UTF-8"
    stroke="transparent"
    v-bind:style="style"
    v-on:wheel="zoomAndPanWheelHandler"
    v-on:mousedown.prevent="(e) => zoomAndPanMouseDown(e) && onClickSpace(e)"
    v-on:mousemove.prevent="zoomAndPanMouseMove"
    v-on:mouseup.prevent="zoomAndPanMouseUp"
    v-on:mouseleave.prevent="zoomAndPanMouseUp">
    <template v-if="isFirefox">
      <g class="symbols">
        <g v-for="symbol in symbols" v-bind:id="symbol.id" v-bind:key="symbol.id" v-html="symbol.content" />
      </g>
    </template>
    <template v-else>
      <defs>
        <g v-for="symbol in symbols" v-bind:id="symbol.id" v-bind:key="symbol.id" v-html="symbol.content" />
      </defs>
    </template>
    <text
      v-if="data.header"
      id="title"
      v-bind:x="landscape.viewBox.titleX"
      v-bind:y="landscape.viewBox.top"
      alignment-baseline="hanging"
      v-bind:style="titleStyle">{{ data.header.title }}
    </text>
    <schema-node
      v-bind:offset-x="0"
      v-bind:offset-y="0"
      v-bind:layer="presentation.layers"
      v-on:node-click="onNodeClick" />
    <schema-track
      v-for="track in presentation.tracks"
      v-bind:key="track.id"
      v-bind:track="track"
      v-bind:line-width-limit="lineWidthLimit"
      v-on:track-over="onTrackOver(track)"
      v-on:track-click="onTrackClick(track)"
      v-on:track-leave="onTrackLeave(track)" />

    <schema-info
      v-show="animation.information"
      v-bind:x="landscape.viewBox.left + 12"
      v-bind:width="landscape.viewBox.width - 24"
      v-bind:text="animation.information" />

    <schema-debug-node
      v-if="debug"
      v-bind:offset-x="0"
      v-bind:offset-y="0"
      v-bind:layer="presentation.layers"
      v-on:node-click="onNodeClick" />


    <template v-if="isBuilding">
      <rect
        fill="#fff"
        opacity="0.8"
        v-bind:x="landscape.viewBox.left"
        v-bind:y="landscape.viewBox.top"
        v-bind:width="landscape.viewBox.width"
        v-bind:height="landscape.viewBox.height" />
      <circle
        v-if="isBuilding"
        class="spinner"
        v-bind:cx="landscape.viewBox.left + landscape.viewBox.width * 0.5 - 25"
        v-bind:cy="landscape.viewBox.top + landscape.viewBox.height * 0.5 - 25"
        r="20"
        fill="none"
        stroke-width="5" />
    </template>

    <template v-if="error">
      <text
        v-bind:x="landscape.viewBox.left"
        v-bind:y="landscape.viewBox.top + 10"
        alignment-baseline="hanging"
        class="error">{{ error }}</text>
    </template>

    Тут должны была быть схема, но что-то пошло не так...
  </svg>
</template>

<script>
  import { v4 as uuidv4 } from 'uuid';

  import href from '@front/helpers/href';

  import SchemaNode from './DHSchemaNode.vue';
  import SchemaTrack from './DHSchemaTrack.vue';
  import SchemaDebugNode from './DHSchemaDebugNode.vue';

  import ZoomAndPan from '../zoomAndPan';

  const Graph = new function() {
    const codeWorker = require(`!!raw-loader!${process.env.VUE_APP_DOCHUB_SMART_ANTS_SOURCE}`).default;
    const scriptBase64 = btoa(unescape(encodeURIComponent(codeWorker)));
    const scriptURL = 'data:text/javascript;base64,' + scriptBase64;

    // Слушатели запросов
    const listeners = {};

    const worker = new Worker(scriptURL);
    worker.onmessage = (message)=> {
      const queryID = message.data.queryID;
      listeners[queryID] && listeners[queryID](message.data);
    };
    this.make = (nodes, links, trackWidth, distance, symbols, availableWidth, isDebug) => {
      return new Promise((success, reject) => {
        const queryID = uuidv4();
        listeners[queryID] = (message) => {
          try {
            if (message.result === 'OK')
              success(message.graph);
            else reject(message.error);
          } finally {
            delete listeners[queryID];
          }
        };
        worker.postMessage({
          queryID,
          params: {
            nodes, links, trackWidth, distance, symbols, availableWidth, isDebug
          }
        });
      });
    };
  };

  import DHSchemaAnimationMixin from './DHSchemaAnimationMixin';
  import DHSchemaExcalidrawMixin from './DHSchemaExcalidrawMixin';
  import SchemaInfo from './DHSchemaInfo.vue';

  // SVG примитивы
  import SVGSymbolCloud from '!!raw-loader!./symbols/cloud.xml';
  import SVGSymbolUser from '!!raw-loader!./symbols/user.xml';
  import SVGSymbolSystem from '!!raw-loader!./symbols/system.xml';
  import SVGSymbolDatabase from '!!raw-loader!./symbols/database.xml';
  import SVGSymbolComponent from '!!raw-loader!./symbols/component.xml';

  const OPACITY = 0.3;
  const IS_DEBUG = false;

  export default {
    name: 'DHSchema',
    components: {
      SchemaNode,
      SchemaTrack,
      SchemaInfo,
      SchemaDebugNode
    },
    mixins: [ DHSchemaAnimationMixin, DHSchemaExcalidrawMixin, ZoomAndPan],
    props: {
      // Дистанция между объектами на диаграмме
      distance: {
        type: Number,
        default: 70
      },
      // Ширина прогладываемых дорожек
      trackWidth: {
        type: Number,
        default: 28
      },
      // Толщина линии дорожки
      trackStrong: {
        type: Number,
        default: 1
      },
      //
      voice: {
        type: Boolean,
        default: true
      },
      data: {
        type: Object,
        default() {
          return {
            symbols: {},
            nodes: {},
            links: [],
            animation: {
              actions: {},
              scenarios: []
            }
          };
        }
      }
    },
    data() {
      return {
        isBuilding: 0,
        resizer: null,
        debug: IS_DEBUG ? {

        } : null,
        selected: {
          links: {},
          nodes: {}
        },
        landscape: {
          symbols: {},
          viewBox : {
            left: 0,
            top: 0,
            width: 1000,
            height: 400
          }
        },
        presentation: {
          layers: {},
          tracks: []
        },
        style: {},
        error: null
      };
    },
    computed: {
      // Проверяем что в Firefox
      isFirefox() {
        return navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
      },
      lineWidthLimit() {
        return +this.data.config?.lineWidthLimit || 20;
      },
      titleStyle() {
        return ({
          'fill': this.data?.header.style['color'],
          'font-weight': this.data?.header.style['font-weight'],
          'font-size': this.data?.header.style['font-size']
        });
      },
      // Возвращает определения (defs) примитивов диаграммы
      symbols() {
        const result = [
          {
            id: '$landscape',
            content: '<g></g>'
          },
          {
            id: '$undefined',
            content: '<text>Ошибочка :(</text>'
          },
          {
            id: 'cloud',
            content: SVGSymbolCloud
          },
          {
            id: 'system',
            content: SVGSymbolSystem
          },
          {
            id: 'database',
            content: SVGSymbolDatabase
          },
          {
            id: 'user',
            content: SVGSymbolUser
          },
          {
            id: 'component',
            content: SVGSymbolComponent
          }
        ];
        for (const id in this.data.symbols || {}) {
          result.push({
            id,
            content: this.data.symbols[id]
          });
        }
        return result;
      },
      // Определяем окно видимости
      viewBox() {
        return `${this.landscape.viewBox.left} ${this.landscape.viewBox.top} ${this.landscape.viewBox.width} ${this.landscape.viewBox.height}`;
      }
    },
    watch: {
      data() {
        this.$nextTick(() => this.rebuildPresentation());
      },
      'selected.nodes'(value) {
        this.$emit('selected-nodes', value);
      },
      'animation.information'() {
        this.rebuildViewBox();
      }
    },
    mounted() {
      window.addEventListener('resize', () => {
        this.resizer && clearTimeout(this.resizer);
        this.resizer = setTimeout(() => {
          this.rebuildViewBox();
        }, 500);
      });
      // new ResizeObserver(() => this.rebuildViewBox()).observe(this.$el);
      this.$nextTick(() => {
        this.rebuildPresentation();
      });
    },
    beforeDestroy(){
      window.removeEventListener('resize', this.rebuildViewBox);
    },
    methods: {
      // Отчистка
      clear() {
        this.presentation = {
          layers: {},
          tracks: []
        };
      },
      // Обновление состояние визуализации нод
      updateNodeView() {
        const map = this.presentation.map;
        const unselected = !Object.keys(this.selected.nodes).length;
        for(const id in map)  {
          const node = map[id];
          this.$set(node, 'opacity', unselected || this.selected.nodes[id] ? 1 : OPACITY);
        }
      },
      // Выделяет ноду
      selectNode(box) {
        this.selected.nodes[box.node.id] = box;
      },
      // Выделяет ноду и ее соседей со связями
      selectNodeAndNeighbors(box) {
        this.selectNode(box);
        this.presentation.tracks.map((track) => {
          if ((track.link.from === box.node.id) || (track.link.to === box.node.id)) {
            this.selected.links[track.id] = track;
            this.selected.nodes[track.link.from] = this.presentation.map[track.link.from];
            this.selected.nodes[track.link.to] = this.presentation.map[track.link.to];
          }
        });
      },
      // Обработка клика по объекту
      onNodeClick(box) {
        if (!window?.event?.shiftKey) {
          this.cleanSelectedTracks();
          this.cleanSelectedNodes();
        }
        this.selectNodeAndNeighbors(box);
        this.updateNodeView();
        this.updateTracksView();
      },
      updateTracksView() {
        const unselected = !Object.keys(this.selected.links).length && !Object.keys(this.selected.nodes).length;
        this.presentation.tracks = this.presentation.tracks.map((track) => {
          if (unselected) {
            this.$set(track, 'animate', false);
            this.$set(track, 'opacity', 1);
          } else {
            this.$set(track, 'highlight', !!this.selected.links[track.id]);
            this.$set(track, 'animate', track.highlight);
            this.$set(track, 'opacity', track.animate ? 1 : OPACITY);
          }
          return track;
        }).sort((track1, track2) => {
          if (track1.highlight && track2.highlight) return -1;
          if (track1.highlight && !track2.highlight) return 0;
          return 1;
        });
      },
      // Фиксируем выбор линка
      onTrackClick(track) {
        if(track.link.link) {
          this.$emit('on-click-link', track.link);
        } else {
          if (!window?.event?.shiftKey) {
            this.cleanSelectedTracks();
            this.cleanSelectedNodes();
          }
          this.selected.links[track.id] = track;
          this.selected.nodes[track.link.from] = this.presentation.map[track.link.from];
          this.selected.nodes[track.link.to] = this.presentation.map[track.link.to];
          this.updateNodeView();
          this.updateTracksView();
        }
      },
      // Обработка событий прохода мышки над связями
      onTrackOver(track) {
        track.highlight =  true;
        this.updateTracksView();
      },
      onTrackLeave(track) {
        if (!this.selected.links[track.id]) {
          this.$set(track, 'highlight', false);
        }
      },
      // Очистка выбора треков
      cleanSelectedTracks() {
        this.selected.links = {};
        this.presentation.tracks.map((track) => {
          this.$set(track, 'animate', false);
          this.$set(track, 'opacity', 1);
          this.$set(track, 'highlight', false);
        });
      },
      // Очистка выбора треков
      cleanSelectedNodes() {
        this.selected.nodes = {};
      },
      // Обработка клика на свободной области
      onClickSpace(event) {
        if(event.shiftKey) return;
        event = event || window.event;
        if (event.which === 1) {
          this.cleanSelectedTracks();
          this.cleanSelectedNodes();
          this.updateNodeView();
        } else event.preventDefault();
      },
      // Перестроить viewbox
      rebuildViewBox() {
        const width = this.presentation.valueBox.dx - this.presentation.valueBox.x;
        let height = Math.max(this.presentation.valueBox.dy - this.presentation.valueBox.y, 100);
        const clientWidth = this.$el?.clientWidth || 0;
        const titleWidth = this.$el?.querySelector('#title')?.clientWidth;

        this.landscape.viewBox.titleX = this.presentation.valueBox.x + (this.presentation.valueBox.dx - this.presentation.valueBox.x)/2 - titleWidth/2;

        this.landscape.viewBox.top = this.presentation.valueBox.y - 48;

        if (this.animation.information) {
          this.landscape.viewBox.top -= 64;
          height += 64;
        }

        this.landscape.viewBox.height = height + 60;

        if (width < clientWidth) {
          const delta = (clientWidth - width) * 0.5;
          this.landscape.viewBox.left = - delta + this.presentation.valueBox.x;
          this.landscape.viewBox.width = width + delta * 2;
          this.$el.style.height = `${height + 60}px`;
        } else {
          this.landscape.viewBox.left = this.presentation.valueBox.x - 24;
          this.landscape.viewBox.width = width + 48;
          this.$el.style.height = `${height * (clientWidth / width) + 60}px`;
        }
      },
      // Перестроение презентации
      rebuildPresentation(nodes, links) {
        this.error = null;
        this.recalcSymbols();
        const trackWidth = this.data.config?.trackWidth || this.trackWidth;
        const distance = this.data.config?.distance || this.distance;
        const hideTitles = this.data.config?.hideTitles;
        nodes = nodes || this.data.nodes || {};
        for(let node in nodes) {
          if(hideTitles || !nodes[node] || !nodes[node]?.title)
            nodes[node] = ({...nodes[node], title: ' ' });
        }
        let availableWidth = this.$el?.clientWidth || 0;
        if (availableWidth < 600) availableWidth = 600;
        this.isBuilding++;
        Graph.make(
          this.data.config?.grid || {},
          nodes,
          links || this.data.links || [],
          trackWidth,
          distance,
          this.landscape.symbols,
          availableWidth,
          this.debug
        )
          .then((presentation) => {
            this.presentation = presentation;
            this.rebuildViewBox();
            this.cleanSelectedTracks();
            this.cleanSelectedNodes();
            this.$nextTick(() => this.$el && href.elProcessing(this.$el));
          })
          .catch((e) => {
            this.error = e.text;
            // eslint-disable-next-line no-console
            console.error(e);
          })
          .finally(() => {
            this.isBuilding > 0 && this.isBuilding--;
          });
      },
      // Рассчитывает размерность примитивов (символов)
      recalcSymbols() {
        this.landscape.symbols = {};
        this.symbols.map((item) => {
          const symbol = this.$el.getElementById(item.id);
          const bbox = symbol.getBBox();
          this.landscape.symbols[item.id] = {
            x: 0,
            y: 0,
            height: bbox.height + bbox.y,
            width: bbox.width + bbox.x
          };
        });
      }
    }
  };
</script>

<style scoped>

.dochub-schema {
  /* border: solid 2px #ff0000; */
  /* max-height: calc(100vh - 64px); */
  aspect-ratio: unset;
}

.wave-cell {
  stroke: #000;
  fill-opacity: 0;
}

.path-cell {
  stroke: #0000ff;
  fill-opacity: 0;
}
.wave-point {
  stroke: #00FF00;
  fill-opacity: 0;
}

.error-cell {
  fill: #f00;
  stroke: #fff;
}

.symbols * {
  opacity: 0;
}

.spinner {
  stroke: rgb(52, 149, 219);
  stroke-linecap: round;
  animation: dash 1.5s ease-in-out infinite;
}

.error {
  stroke: red;
  fill: red;
}

@keyframes rotate {
  100% {
    transform: rotate(360deg);
  }
}

@keyframes dash {
  0% {
    stroke-dasharray: 1, 150;
    stroke-dashoffset: 0;
  }
  50% {
    stroke-dasharray: 90, 150;
    stroke-dashoffset: -35;
  }
  100% {
    stroke-dasharray: 90, 150;
    stroke-dashoffset: -124;
  }
}

* {
  transition: all 0.15s ease-in;
}

</style>
