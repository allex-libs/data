function createMemoryMapStorage (execlib, mylib) {
  'use strict';
  var lib = execlib.lib,
    AssociativeStorageBase = mylib.AssociativeStorageBase;

  function MemoryMapStorage (storagedescriptor, visiblefields, data) {
    AssociativeStorageBase.call(this, storagedescriptor, data);
  }
  lib.inherit(MemoryMapStorage, AssociativeStorageBase);
  MemoryMapStorage.prototype._createData = function () {
    return new lib.Map();
  };
  MemoryMapStorage.prototype._traverseData = function (func) {
    this.data.traverse(func);
  };
  MemoryMapStorage.prototype.getMethodName = 'get';
  MemoryMapStorage.prototype.addMethodName = 'add';
  MemoryMapStorage.prototype.replaceMethodName = 'replace';
  MemoryMapStorage.prototype.removeMethodName = 'remove';

  mylib.MemoryMapStorage = MemoryMapStorage;
}

module.exports = createMemoryMapStorage;
