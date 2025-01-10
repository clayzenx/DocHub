<template>
  <div class="plugin">
    <v-btn color="primary" v-on:click="onLoad">Загрузить EXCEL</v-btn>
  </div>
</template>

<script>
  import gateway from '@idea/gateway';
  import ExcelJS from 'exceljs';
  import yaml from 'yaml';

  export default {
    props: {
      profile: {
        type: Object,
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
        data: {}
      };
    },

    mounted() {
      gateway.appendListener('plugin:/idea/gateway/uploaded', this.upload);
    },

    unmounted() {
      gateway.removeListener('plugin:/idea/gateway/uploaded', this.upload);
    },

    methods: {
      async onLoad() {
        window.$PAPI.upload();
      },

      async upload(file) {
        const response = Object.values(file)[0];
        const { data } = JSON.parse(response);

        const binaryString = atob(data);

        const uint8Array1 = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          uint8Array1[i] = binaryString.charCodeAt(i);
        }

        const blob = new Blob([uint8Array1], { type: 'application/vnd.ms-excel' });

        const arrayBuffer = await blob.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);

        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(uint8Array);


        workbook.worksheets.forEach((list) => {
          const tables = list.getTables();

          tables.forEach(({ table, name }) => {

            const tableData = [];

            const [firstCell, lastCell] = table.tableRef.split(':');
            const { col: firstColIndex, row: firstRowIndex } = list.getCell(firstCell).fullAddress;
            const { col: lastColIndex, row: lastRowIndex } = list.getCell(lastCell).fullAddress;

            let currentRowIndex = firstRowIndex + 1;

            while (currentRowIndex <= lastRowIndex) {
              const rowData = [];
              const row = list.getRow(currentRowIndex);
              let currentColIndex = firstColIndex;

              while (currentColIndex <= lastColIndex) {
                rowData.push(row.getCell(currentColIndex).value || null);
                currentColIndex++;
              }
              tableData.push(rowData);
              currentRowIndex++;
            }

            this.data[name] = tableData;
          });
        });

        this.profile.tables.forEach(async({ name, output, source }) => {
          const data = await this.pullData(source, this.profile, this.params, this.data[name]);
          this.putContent(output, yaml.stringify(data));
        });
      }
    }
  };
</script>

<style>
.plugin {
  padding: 12px;
}
</style>
