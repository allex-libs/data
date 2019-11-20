function createDataUtils(execlib, mylib){
  'use strict';
  var lib = execlib.lib,
      recordSuite = mylib.recordSuite;

  function copyExceptRecord(dest,item,itemname){
    if(itemname!=='record'){
      dest[itemname] = item;
    }
  }
  function inherit(d1,d2){
    var result = {}, cp = copyExceptRecord.bind(null,result);
    lib.traverse(d1,cp);
    lib.traverse(d2,cp);
    result.record = recordSuite.inherit(d1.record,d2.record);
    return result;
  }

  mylib.inherit = inherit;

  function container (masterarry, item) {
    return masterarry.indexOf(item)>=0;
  }
  function fixvisiblefields (queryprophash, uservisiblefields) {
    if (!lib.isArray(queryprophash.visiblefields)) {
      queryprophash.visiblefields = uservisiblefields;
      return;
    }
    queryprophash.visiblefields = queryprophash.visiblefields.filter(container.bind(null, uservisiblefields));
  }

  mylib.fixvisiblefields = fixvisiblefields;

  function isFilterExact (filter) {
    if (filter instanceof mylib.filterFactory.get('eq')) {
      return true;
    }
    if (filter instanceof mylib.filterFactory.get('and')) {
      return filter.filters.every(isFilterExact);
    }
    return false;
  }

  function amendToRecordFromExactFilter (record, filter) {
    var _r;
    if (filter instanceof mylib.filterFactory.get('eq')) {
      record.set(filter.fieldname, filter.fieldvalue);
      return;
    }
    if (filter instanceof mylib.filterFactory.get('and')) {
      _r = record;
      filter.filters.forEach(amendToRecordFromExactFilter.bind(null, _r));
      _r = null;
    }
  }

  mylib.filterUtils = {
    isExact: isFilterExact,
    amendToRecordFromExactFilter: amendToRecordFromExactFilter
  };
}

module.exports = createDataUtils;
