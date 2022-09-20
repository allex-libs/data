function createMemoryStorage(execlib, mylib){
  'use strict';
  var lib = execlib.lib,
    q = lib.q,
    MemoryStorageBase = mylib.MemoryStorageBase;

  function MemoryStorage (storagedescriptor, visiblefields, data) {
    MemoryStorageBase.call(this, storagedescriptor, visiblefields, data);
  }
  lib.inherit(MemoryStorage, MemoryStorageBase);
  MemoryStorage.prototype._createData = function () {
    return [];
  };
  MemoryStorage.prototype._destroyDataWithElements = function () {
    lib.arryDestroyAll(this.data);
  };
  MemoryStorage.prototype._traverseData = function (cb) {
    this.data.forEach(cb);
    return q(true);
  };
  MemoryStorage.prototype._traverseDataRange = function (cb, start, endexclusive) {
    for(var i=start; i<endexclusive; i++){
      cb(query,defer,this.__record.filterHash(this.data[i]));
    }
    return q(true);
  };
  MemoryStorage.prototype.removeDataAtIndex = function (index) {
    if (!lib.isArray(this.data)) {
      return;
    }
    if (index === this.data.length-1) {
      this.data.pop();
    } else if (index === 0){
      this.data.shift();
    } else {
      this.data.splice(index, 1);
    }
  };
  MemoryStorage.prototype._traverseConditionally = function (cb) {
    return this.data.some(cb);
  };

  mylib.MemoryStorage = MemoryStorage;
}

module.exports = createMemoryStorage;
