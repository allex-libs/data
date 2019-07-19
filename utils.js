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

  function isFilterExact (filter) {
    if (filter instanceof mylib.filterFactory.get('eq')) {
      return true;
    }
    return false;
  }

  function amendToRecordFromExactFilter (record, filter) {
    if (isFilterExact(filter)) {
      record.set(filter.fieldname, filter.fieldvalue);
    }
  }

  mylib.filterUtils = {
    isExact: isFilterExact,
    amendToRecordFromExactFilter: amendToRecordFromExactFilter
  };
}

module.exports = createDataUtils;
