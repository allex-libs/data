function createNullStorage(execlib, mylib){
  'use strict';
  var StorageBase = mylib.StorageBase;
  function NullStorage(recorddescriptor){
    StorageBase.call(this,recorddescriptor);
  }
  execlib.lib.inherit(NullStorage,StorageBase);
  NullStorage.prototype.doCreate = function(datahash,defer){
    defer.resolve(datahash);
  };
  NullStorage.prototype.doRead = function(query,defer){
    defer.resolve(null);
  };
  NullStorage.prototype.doUpdate = function(filter,datahash,defer){
    defer.resolve(0);
  };
  NullStorage.prototype.doDelete = function(filter,defer){
    defer.resolve(0);
  };
  mylib.NullStorage = NullStorage;
}

module.exports = createNullStorage;
