function createAssociativeMixin (execlib, mylib) {
  'use strict';

  var lib = execlib.lib;

  function AssociativeStorageMixin () {
    if (!lib.isString(this.__record.primaryKey)) {
      throw new lib.Error('SIMPLE_PRIMARY_KEY_ONLY', this.constructor.name+' wants to implement the AssociativeStorageMixin, but the recorddescriptor must have a simple String primaryKey');
    }
  }
  AssociativeStorageMixin.prototype.destroy = lib.dummyFunc;
  AssociativeStorageMixin.prototype.record2Key = function (record) {
    return record[this.__record.primaryKey];
  };
  AssociativeStorageMixin.prototype.queryAsksForSingleKey = function (query) {
    var filt;
    if (query && lib.isFunction(query.filter)) {
      filt = query.filter();
    }
    if (!filt) {
      return null;
    }
    return this.filterAsksForSingleKey(filt);
  };
  AssociativeStorageMixin.prototype.filterAsksForSingleKey = function (filter) {
    if (mylib.filterUtils.isExact(filter) && filter.fieldname === this.__record.primaryKey) {
      return filter.fieldvalue;
    }
    return null;
  };

  AssociativeStorageMixin.addMethods = function (klass) {
    lib.inheritMethods(klass, AssociativeStorageMixin
      ,'record2Key'
      ,'queryAsksForSingleKey'
      ,'filterAsksForSingleKey'
    );
  };

  mylib.AssociativeStorageMixin = AssociativeStorageMixin;
}

module.exports = createAssociativeMixin;
