<template>
  <g>
    <g
      v-for="(box, idx) in layer.boxes"
      v-bind:key="box.node + idx">
      <g v-if="isArea(box)">
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
      </g>
      <g v-else>
        <use
          v-bind:key="box.node.id"
          v-bind:style="{ opacity: box.opacity }"
          v-bind:x="box.absoluteX"
          v-bind:y="box.absoluteY"
          v-bind:xlink:href="`#${box.node.symbol}`"
          v-on:mousedown.stop.prevent="onNodeClick(box)" />
        <text
          v-bind:style="{ opacity: box.opacity }"
          class="node-text"
          text-anchor="middle"
          v-bind:x="box.absoluteX + box.width * 0.5"
          v-bind:y="box.absoluteY + box.height + 12">
          {{ box.node.title || box.node.id }}
        </text>
      </g>
      <schema-node
        v-bind:offset-x="box.x"
        v-bind:offset-y="box.y"
        v-bind:layer="box.node"
        v-on:node-click="onNodeClick" />
    </g>
  </g>
</template>

<script>

  const SchemaNode = {
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
      }
    },
    data() {
      return {
      };
    },
    methods: {
      onNodeClick(box) {
        this.$emit('node-click', box);
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
