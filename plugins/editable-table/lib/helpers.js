export function checkIsValueEmpty(value) {
  return (
    value === undefined ||
    value === null ||
    value === '' ||
    (Array.isArray(value) && value.length === 0)
  );
}

export function parseSelectOptions(options) {
  const parsedOptions = [];
  for (let value in options) {
    const text = options[value].type ?? value;
    parsedOptions.push({ value, text });
  }
  return parsedOptions;
}

export function getMultipleRowSorter(sortList) {
  return (rowA, rowB) => {
    const a = rowA[1];
    const b = rowB[1];

    for (let { value, direction } of sortList) {
      if (checkIsValueEmpty(a[value])) {
        return direction === 'inc' ? -1 : 1;
      }

      if (checkIsValueEmpty(b[value])) {
        return direction === 'inc' ? 1 : -1;
      }

      const isArray = Array.isArray(a[value]);
      const isNumber = !isNaN(Number(a[value]));
      const isBoolean = typeof a[value] === 'boolean';

      let first;
      let second;
      if (isArray) {
        first = a[value].length;
        second = b[value].length;
      } else if (isNumber || isBoolean) {
        first = Number(a[value]);
        second = Number(b[value]);
      } else {
        first = a[value].toLowerCase();
        second = b[value].toLowerCase();
      }

      if (first < second) return direction === 'inc' ? -1 : 1;
      if (first > second) return direction === 'inc' ? 1 : -1;
    }
  };
}

function checkIsEqual(value, checkValue) {
  return value === checkValue;
}

function checkIsStringIncludeValue(value, checkValue) {
  return value.includes(checkValue);
}

function parseRegExp(str) {
  const [pattern, flags] = str.split('/').slice(1);
  return new RegExp(pattern, flags);
}
function checkByRegExp(value, regExp) {
  return value.match(parseRegExp(regExp)) !== null;
}

function checkIsConditionPassed(type, value, checkValue) {
  switch (type) {
    case 'equal':
      return checkIsEqual(value, checkValue);
    case 'includes':
      return checkIsStringIncludeValue(value, checkValue);
    case 'match':
      return checkByRegExp(value, checkValue);
    case '>':
      return Number(value) > Number(checkValue);
    case '>=':
      return Number(value) >= Number(checkValue);
    case '<':
      return Number(value) < Number(checkValue);
    case '<=':
      return Number(value) <= Number(checkValue);
  }
}

export function getStylesToApply(value, styles) {
  if (checkIsValueEmpty(value)) {
    return '';
  }

  let result = {};
  for (let key in styles) {
    const currentStyles = styles[key];

    if (currentStyles.conditions) {
      for (let i = 0; i < currentStyles.conditions.length; i++) {
        const { condition_type, value: checkValue } =
          currentStyles.conditions[i];
        if (checkIsConditionPassed(condition_type, value, checkValue)) {
          result = { ...result, ...currentStyles };
          delete result.conditions;
          break;
        }
      }
    } else {
      result = { ...result, ...currentStyles };
    }
  }
  return result;
}

export function deepMerge(target, source) {
  for (let key in source) {
    const value = source[key];

    if (typeof value === 'object' && !Array.isArray(value)) {
      if (typeof target[key] === 'undefined') {
        target[key] = {};
      }
      const deepTarget = target[key];
      deepMerge(deepTarget, value);
    } else {
      target[key] = value;
    }
  }
  return target;
}

export function mergeHeaders(targetList, sourceList) {
  if(!targetList || !sourceList) {
    return targetList ?? sourceList;
  }

  const HEADER_INDEX_MAP = {};
  targetList.forEach((header, index) => {
    HEADER_INDEX_MAP[header.value] = index;
  });

  sourceList.forEach((header) => {
    let index = HEADER_INDEX_MAP[header.value];

    if(index === undefined) {
      targetList.push(header);
    } else {
      deepMerge(targetList[index], header);
    }
  });

  return targetList;
}

export function prepareTableData(data, headers) {
  const dataTable = {};

  for (let rowID in data) {
    const row = data[rowID];

    if (dataTable[rowID] === undefined) {
      dataTable[rowID] = {};
    }
    
    for (let headerID in headers) {
      const { type } = headers[headerID];

      if (type === 'checkbox') {
        dataTable[rowID][headerID] = !!row[headerID];
        continue;
      }
      dataTable[rowID][headerID] = row[headerID] ?? null;
    }
  }
  return dataTable;
}
