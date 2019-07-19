function createAssociativeStorageBase (execlib, mylib) {
  'use strict';
  var lib = execlib.lib,
    StorageBase = mylib.StorageBase,
    AssociativeStorageMixin = mylib.AssociativeStorageMixin,
    MemoryStorageBase = mylib.MemoryStorageBase;

  function AssociativeStorageBase (storagedescriptor, visiblefields, data) {
    StorageBase.call(this, storagedescriptor, data);
    AssociativeStorageMixin.call(this);
    this.data = data || this._createData();
  }
  lib.inherit(AssociativeStorageBase, StorageBase);
  AssociativeStorageMixin.addMethods(AssociativeStorageBase);
  AssociativeStorageBase.prototype.destroy = function () {
    if (this.data) {
      lib.containerDestroyAll(this.data);
      this.data.destroy();
    }
    this.data = null;
    AssociativeStorageMixin.prototype.destroy.call(this);
    StorageBase.prototype.destroy.call(this);
  };
  AssociativeStorageBase.prototype.addRecordAndPossiblyReject = function (record, defer, update) {
    var key, old;
    if (!this.data) {
      defer.reject(new lib.Error('ALREADY_DESTROYED', 'This instance of '+this.constructor.name+' is already destroyed'));
    }
    key = this.record2Key(record);
    if (lib.isVal(key)) {
      if (update) {
        old = this.data[this.replaceMethodName](key, record);
        if (q.isThenable(old)) {
          return old.then(
            this.finishReplaceRecord.bind(this, record, defer),
            defer.reject.bind(defer)
          );
        }
        return this.finishReplaceRecord(record, defer, old);
      }
      return this.data[this.addMethodName](key, record);
    }
    defer.reject(new lib.Error('NO_PRIMARY_KEY_IN_RECORD', 'Record '+JSON.stringify(record)+' did not have the value of primary key '+this.__record.primaryKey));
  };
  AssociativeStorageBase.prototype.finishReplaceRecord = function (record, defer, old) {
    defer.notify([record, old]);
    return true;
  };
  AssociativeStorageBase.prototype.doCreate = function (record, defer) {
    this.addRecordAndPossiblyReject(record, defer);
    defer.resolve(record);
  };
  AssociativeStorageBase.prototype.doRead = function (query, defer) {
    var singlekey, val;
    if (!this.data) {
      defer.resolve(null);
      return;
    }
    singlekey = this.queryAsksForSingleKey(query);
    if (lib.isVal(singlekey)) {
      val = this.data[this.getMethodName](singlekey);
      if (q.isThenable(val)) {
        return val.then(
          this.finishDoRead.bind(this, defer),
          defer.reject.bind(defer)
        );
      }
      return this.finishDoRead(defer, val);
    }
    return MemoryStorageBase.prototype.doRead.call(this, query, defer);
  };
  AssociativeStorageBase.prototype.finishDoRead = function (defer, val) {
    if (lib.isVal(val)) {
      defer.notify(val);
    }
    defer.resolve(true);
    defer = null;
    val = null;
  };
  AssociativeStorageBase.prototype.doUpdate = function (filter, updatehash, options, defer) {
    var singlekey, val;
    if (!this.data) {
      defer.resolve(null);
      return;
    }
    singlekey = this.filterAsksForSingleKey(filter);
    if (lib.isVal(singlekey)) {
      val = this.data[this.getMethodName](singlekey);
      if (q.isThenable(val)) {
        return val.then(
          this.continueDoUpdateForSingleKey.bind(this, filter, updatehash, options, defer),
          defer.reject.bind(defer)
        );
      }
      return this.continueDoUpdateForSingleKey(filter, updatehash, options, defer, val);
    }
    return MemoryStorageBase.prototype.doUpdate.call(this, filter, updatehash, options, defer);
  };
  AssociativeStorageBase.prototype.continueDoUpdateForSingleKey = function (filter, updatehash, options, defer, val) {
    var upserthash, araprres;
    if (!lib.isVal(val)) {
      if (options && options.upsert) {
        upserthash = this.__record.filterObject(updatehash);
        upserthash[filter.fieldname] = filter.fieldvalue;
        this.addRecordAndPossiblyReject(upserthash, defer);
        if (this.events) {
          this.events.fireNewRecord(upserthash);
        }
        defer.resolve({upserted: 1});
        return;
      }
      defer.resolve(null);
      return;
    }
    araprres = this.addRecordAndPossiblyReject(this.__record.filterObject(lib.extend({}, val, updatehash)), defer, true);
    if (q.isThenable(araprres)) {
      return araprres.then(
        this.finishDoUpdate.bind(this, defer),
        defer.reject.bind(defer)
      );
    }
    return this.finishDoUpdate(defer);
  };
  AssociativeStorageBase.prototype.finishDoUpdate = function (defer) {
    defer.resolve({updated: 1});
    return true;
  };
  AssociativeStorageBase.prototype.doDelete = function (filter, defer) {
    var singlekey, rmres;
    if (!this.data) {
      defer.resolve(null);
      return;
    }
    singlekey = this.filterAsksForSingleKey(filter);
    if (lib.isVal(singlekey)) {
      rmres = this.data[this.removeMethodName](singlekey);
      if (q.isThenable(rmres)) {
        rmres.then(
          this.finishDoDelete.bind(this, defer),
          defer.reject.bind(defer)
        );
      }
      return this.finishDoDelete(defer, rmres);
    }
  };
  AssociativeStorageBase.prototype.finishDoDelete = function (defer, rmres) {
    defer.resolve(rmres ? 1 : 0);
    return true;
  };

  mylib.AssociativeStorageBase = AssociativeStorageBase;
}

module.exports = createAssociativeStorageBase;
