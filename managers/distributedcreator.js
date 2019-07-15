function createDistributedDataManager(execlib, mylib){
  'use strict';
  var lib = execlib.lib,
    q = lib.q,
    qlib = lib.qlib,
    Destroyable = lib.Destroyable,
    ComplexDestroyable = lib.ComplexDestroyable,
    filterFactory = mylib.filterFactory,
    QueryBase = mylib.QueryBase,
    QueryClone = mylib.QueryClone,
    StreamDistributor = mylib.StreamDistributor,
    DataManager = mylib.DataManager,
    JobBase = qlib.JobBase;

  function DistributedDataManager(storageinstance,filterdescriptor){
    DataManager.call(this,storageinstance,filterdescriptor);
    this.distributor = new StreamDistributor();
    this.setSink(this.distributor);
  }
  lib.inherit(DistributedDataManager,DataManager);
  DistributedDataManager.prototype.destroy = function(){
    if (this.distributor) {
      this.distributor.destroy();
    }
    this.distributor = null;
    DataManager.prototype.destroy.call(this);
  };
  mylib.DistributedDataManager = DistributedDataManager;
}

module.exports = createDistributedDataManager;
