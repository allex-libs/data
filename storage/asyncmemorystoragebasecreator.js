function createAsyncMemoryStorageBase (execlib, mylib) {
  'use strict';
  var lib = execlib.lib,
    q = lib.q,
    MemoryStorageBase = mylib.MemoryStorageBase,
    AsyncStorageMixin = mylib.AsyncStorageMixin;

  function AsyncMemoryStorageBase(storagedescriptor, visiblefields, data) {
    AsyncStorageMixin.call(this);
    MemoryStorageBase.call(this, storagedescriptor, visiblefields, data);
  }
  lib.inherit(AsyncMemoryStorageBase, MemoryStorageBase);
  AsyncStorageMixin.addMethods(AsyncMemoryStorageBase, MemoryStorageBase);
  AsyncMemoryStorageBase.prototype.destroy = function () {
    MemoryStorageBase.prototype.destroy.call(this);
    AsyncStorageMixin.prototype.destroy.call(this);
  };

  mylib.AsyncMemoryStorageBase = AsyncMemoryStorageBase;
}

module.exports = createAsyncMemoryStorageBase;
