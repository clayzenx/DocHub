<template>
  <div class="selector" v-on:click="onWrapperClick">
    <button ref="dropdownButton" class="button" v-bind:disabled="disabled" v-on:click="onButtonClick">
      <v-icon medium class="button__icon mdi mdi-menu-down" v-bind:class="{ button__icon_open: isSelectOpen }" />
    </button>
    <div class="selector__visibile-container" />

    <div class="selected-list">
      <div
        v-for="(selectId, ind) in inputValue"
        v-bind:key="selectId"
        class="selected-list__item"
        v-bind:style="stylesToApply[ind]">
        <button v-if="!disabled" class="selected-list__button" icon v-on:click.stop="() => onRemoveItem(selectId)">
          <v-icon medium>cancel</v-icon>
        </button>
        {{ valueTextMap[selectId] }}
      </div>
    </div>

    <div v-if="!disabled && isSelectOpen" v-click-outside="onOutsideClick" class="selector__options-wrapper">
      <div class="options-list" v-on:click.stop>
        <label
          v-for="(option) in options"
          v-bind:key="option.value"
          class="options-list__item"
          v-bind:class="{ 'options-list__item_selected': inputValue.includes(option.value) }">
          <input
            class="options-list__input"
            v-bind:type="multiple ? 'checkbox' : 'radio'"
            name="option-item"
            v-bind:class="multiple ? '' : 'options-list__radio'"
            v-bind:checked="inputValue.includes(option.value)"
            v-bind:value="option.value"
            v-on:change="onSelect">
          <div>{{ option.text }}</div>
        </label>
      </div>
    </div>
  </div>
</template>

<script>
  import { getStylesToApply } from '../../lib/helpers';

  export default {
    props: {
      value: {
        type: null,
        required: true
      },
      options: {
        type: Array,
        required: true
      },
      multiple: {
        type: Boolean,
        required: false,
        default: () => false
      },
      disabled: {
        type: Boolean,
        required: false,
        default: () => false
      },
      styles: {
        type: Object,
        required: true
      }
    },

    data() {
      return {
        isSelectOpen: false,
        inputValue: this.prepareValue(this.value)
      };
    },

    computed: {
      valueTextMap() {
        const map = {};
        this.options.forEach(({ value, text }) => map[value] = text);
        return map;
      },
      stylesToApply() {
        return this.inputValue.map(value => getStylesToApply(value, this.styles));
      }
    },

    watch: {
      value() {
        this.inputValue = this.prepareValue(this.value);
      }
    },

    methods: {
      prepareValue(value) {
        if (value === undefined || value === null) {
          return [];
        } else if (typeof value === 'string') {
          return [value];
        }
        return value;
      },

      onRemoveItem(selectId) {
        this.updateData(this.inputValue.filter((select) => select !== selectId));
      },

      multipleSelect(newValue) {
        if (this.inputValue.includes(newValue)) {
          this.onRemoveItem(newValue);
        } else {
          this.updateData([...this.inputValue, newValue]);
        }
      },

      singleSelect(newValue) {
        this.updateData([newValue]);
        this.isSelectOpen = false;
      },

      onSelect(e) {
        const newValue = e.target.value;
        if (this.multiple) {
          this.multipleSelect(newValue);
          return;
        }
        this.singleSelect(newValue);
      },

      updateData(newValue) {
        this.inputValue = newValue;
        this.$emit('input', this.multiple ? newValue : newValue[0]);
      },

      onWrapperClick() {
        this.$refs.dropdownButton.focus();
        this.onButtonClick();
      },
      onButtonClick() {
        this.isSelectOpen = true;
      },
      onOutsideClick() {
        this.isSelectOpen = false;
      }
    }
  };
</script>

<style scoped>
.selector {
  min-width: 100%;
  min-height: 100%;
  position: relative;
  display: flex;
  cursor: pointer;
}

.selector__visibile-container {
  min-width: 100%;
  min-height: 100%;

  position: absolute;
  top: 0;
  left: 0;

  outline: 1px solid var(--color-border);
  border-radius: 4px;
}

.button {
  border-radius: 50%;
  float: right;
  display: flex;
  justify-content: center;
  align-items: center;

  transition: .15s;

  z-index: 5;
  position: relative;
  order: 1;
  align-self: flex-start;

  outline: none;
}

.button::before {
  width: 80%;
  height: 80%;
  border-radius: 50%;
  background-color: var(--color-bg-icon);
  opacity: 0;
  content: "";
  position: absolute;
  top: center;
  left: center;
  z-index: 0;
}

.button:hover.button::before {
  opacity: .75;
}

.button:focus .button__icon {
  color: var(--color-primary);
}

.button__icon {
  transition: .25s;
}

.button__icon_open {
  transform: rotateX(180deg);
}

.button:focus+.selector__visibile-container {
  outline-width: 2px;
  outline-color: var(--color-primary);
}

/* ----------------------- ITEMS ----------------------- */
.selected-list {
  width: 100%;
  min-height: 100%;
  padding: 4px 8px;

  display: flex;
  flex-direction: column;
  align-items: start;
  gap: 6px;
}

.selected-list__item {
  border-radius: 16px;
  padding: 4px 8px;
  background-color: var(--color-border);
}

.selected-list__button {
  margin-left: 8px;
  border-radius: 50%;
  float: right;
  display: flex;
  justify-content: center;
  align-items: center;

  transition: .15s;
  position: relative;
  z-index: 5;
}

.selected-list__button::before {
  width: 110%;
  height: 110%;
  border-radius: 50%;
  background-color: var(--color-bg-icon);
  opacity: 0;
  content: "";
  position: absolute;
  top: center;
  left: center;
  z-index: 0;
}

.selected-list__button:hover.selected-list__button::before {
  opacity: 0.75;
}

.selected-list__button:focus {
  outline-color: var(--color-primary);
  transform: scale(1.1);
}

/* ----------------------- OPTIONS ----------------------- */
.selector__options-wrapper {
  min-width: calc(100% - 24px);
  position: absolute;
  top: 0;
  right: 24px;
  z-index: 10;
}

.options-list {
  background-color: var(--color-bg-cell);
  padding: 4px 0;
  box-shadow: 0px 0px 8px 4px rgba(34, 60, 80, 0.35);
  border-radius: 4px;
  z-index: 10;
  overflow: hidden;
}

.options-list> :nth-child(n + 2) {
  border-top: 1px solid var(--color-border);
}

.options-list__item {
  padding: 0 8px;
  min-height: 48px;
  display: flex;
  gap: 14px;
  align-items: center;
  cursor: pointer;
}

.options-list__input {
  width: 18px;
  height: 18px;
}

.options-list__item:hover:not(.options-list__item_selected) {
  background-color: var(--color-bg-filter);
}

.options-list__item_selected {
  background-color: var(--color-select);
}

.options-list__radio {
  display: none;
}
</style>
