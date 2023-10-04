<template>
  <g>
    <g
      v-for="(box, idx) in layer.boxes"
      v-bind:key="box.node + idx">
      <g
        v-if="isArea(box)" 
        v-on:dblclick.stop.prevent="onNodeDblClick(box, true)">
        <template v-if="isShowArea">
          <rect
            v-if="isArea(box)"
            class="box"
            v-bind:x="box.absoluteX"
            v-bind:y="box.absoluteY"
            v-bind:width="box.width"
            v-bind:height="box.height"
            rx="6" />
          <text
            class="box-text"
            v-bind:x="box.absoluteX + 4"
            v-bind:y="box.absoluteY + 16">
            {{ box.node.title || box.node.id }}
          </text>
        </template>
      </g>
      <g v-else-if="isShowNode">
        <use
          v-bind:key="box.node.id"
          v-bind:style="{ opacity: box.opacity }"
          v-bind:x="box.absoluteX"
          v-bind:y="box.absoluteY - 16"
          v-bind:xlink:href="`#${box.node.symbol}`"
          v-on:mousedown.stop.prevent="onNodeClick(box, false)"
          v-on:dblclick.stop.prevent="onNodeDblClick(box, false)" />
        <text
          v-bind:transform="`translate(${box.absoluteX},${box.absoluteY + box.height})`" 
          class="node-text"
          v-bind:style="{ opacity: box.opacity }">
          <tspan 
            v-for="(line, index) in textLines(box)"
            v-bind:key="index"
            v-bind:x="box.width * 0.5"
            v-bind:y="index * 12"
            text-anchor="middle">
            {{ line }}
          </tspan>
        </text>          
      </g>
      <schema-node
        v-bind:offset-x="box.x"
        v-bind:offset-y="box.y"
        v-bind:layer="box.node"
        v-bind:mode="mode"
        v-on:node-dblclick="onNodeDblClick"
        v-on:node-click="onNodeClick" />
    </g>
  </g>
</template>

<script>

  const CHAR_WIDTH = 5;

  export const SchemaNode = {
    name: 'DHSchemaNode',
    props: {
      offsetX: {
        type: Number,
        required: true
      },
      offsetY: {
        type: Number,
        required: true
      },
      layer: {
        type: Object,
        required: true
      },
      mode: {
        type: String,
        required: true,
        validator: (val) => ['area', 'node', 'all'].includes(val)
      }
    },
    data() {
      return {
      };
    },
    computed: {
      isShowArea() {
        return this.mode === 'area' || this.mode === 'all';
      },
      isShowNode() {
        return this.mode === 'node' || this.mode === 'all';
      }
    },
    methods: {
      textLines(box) {
        const title = box.node.title || box.node.id;
        const result = [];
        let offset = 0;
        let length = 0;
        let line = null;
        // eslint-disable-next-line no-useless-escape
        title.split(/\s|\.|\,\;/).map((pice) => {
          const width = pice.length * CHAR_WIDTH + CHAR_WIDTH;
          const segment = title.slice(offset, offset + pice.length + 1);
          if ((length + width > box.width) && line) {
            result.push(line);
            length = 0;
            line = null;
          }
          offset += pice.length + 1;
          length += width;
          line = `${line || ''}${segment}`;
        });

        line && result.push(line);

        return result;
      },
      onNodeDblClick(box, isArea) {
        this.$emit('node-dblclick', box, isArea);
      },
      onNodeClick(box, isArea) {
        this.$emit('node-click', box, isArea);
      },
      classes() {
        const result = [];
        result.push('node-highlight');
        return result.join(' ');
      },
      isArea(item) {
        return item.node.subitems && Object.keys(item.node.subitems).length;
      }
    }
  };

  SchemaNode.components = {
    SchemaNode
  };

  export default SchemaNode;
</script>

<style scoped>
.box {
  stroke: rgba(0,0,0,.6);
  fill-opacity: 0;
  font-size: 12px;
}

.box:hover {
  stroke: rgba(255,0,0,.6);
  stroke-width: 5px;
}

* {
  transition: all 0.15s ease-in;
}

.node-text {
  font-size: 10px;
}

.box-text {
  font-size: 12px;
}

.node-highlight {
  stroke: #F00;
  opacity: 0.5;
}

</style>
