<template>
  <entity
    entity="aspects"
    presentation="blank"
    v-bind:params="{ 'dh-aspect-id': aspect }" />
</template>

<script>
  import Entity from '@front/components/Entities/Entity.vue';

  export default {
    name: 'ArchAspect',
    components: {
      Entity
    },
    props: {
      aspect: { type: String, default: '' }
    },
    data() {
      return {
      };
    }
  };
</script>

