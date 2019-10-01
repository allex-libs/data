function createMemoryStorageBase (execlib, mylib) {
  'use strict';
  var lib = execlib.lib,
    q = lib.q,
    StorageBase = mylib.StorageBase;

  function MemoryStorageBase(storagedescriptor,visiblefields,data){
    StorageBase.call(this,storagedescriptor,visiblefields);
    this.mydata = !data;
    this.data = data || this._createData();
  }
  execlib.lib.inherit(MemoryStorageBase,StorageBase);
  MemoryStorageBase.prototype.destroy = function(){
    if (this.mydata) {
      this._destroyDataWithElements();
    }
    this.mydata = null;
    this.data = null;
    StorageBase.prototype.destroy.call(this);
  };
  MemoryStorageBase.prototype.doCreate = function(record,defer){
    var pr;
    if (!this.__record) {
      defer.resolve(null);
      return;
    }
    pr = this.data.push(record);
    if (pr && q.isThenable(pr)) {
      pr.then(
        defer.resolve.bind(defer, record),
        defer.reject.bind(defer)
      );
    } else {
      defer.resolve(record/*.clone()*/);
    }
  };
  function processRead(__id,query,defer,item){
    if(query.isOK(item)){
      //defer.notify(item.toHash(query.fields()));
      defer.notify(item);
    }
  }
  MemoryStorageBase.prototype.doRead = function(query,defer){
    var tr, start, end;
    if (!this.data) {
      defer.resolve(null);
      return;
    }
    if(!(query.isLimited()||query.isOffset())){
      tr = this._traverseData(processRead.bind(null,this.__id,query,defer));
    }else{
      start = query.offset;
      end=Math.min(start+query.limit,this.data.length);
      tr = this._traverseDataRange(processRead.bind(null, this.__id,query, defer), start, end);
    }
    if (q.isThenable(tr)) {
      return tr.then(defer.resolve.bind(defer, null));
    }
    defer.resolve(null);
  };
  MemoryStorageBase.prototype.onUpsertSucceeded = function(defer,createdrecord){
    if (this.events) {
      this.events.fireNewRecord(createdrecord);
    }
    defer.resolve({upserted:1});
  };
  MemoryStorageBase.prototype.processUpsert = function(defer,updateobj,filter,datahash,options){
    var d = q.defer(), upserthash;
    upserthash = this.__record.filterObject(datahash);
    mylib.filterUtils.amendToRecordFromExactFilter(upserthash, filter);
    this.doCreate(upserthash,d);
    d.promise.done(
      this.onUpsertSucceeded.bind(this,defer),
      defer.reject.bind(defer)
    );
  };
  function updateFrom (countobj,record,updateitem,updateitemname){
    if(record.hasFieldNamed(updateitemname)){
      if(countobj.count<1){
        countobj.original = record.clone();
      }
      countobj.count++;
      record.set(updateitemname,updateitem);
    }
  }
  MemoryStorageBase.prototype.processUpdate = function(updateobj,filter,datahash,options,record,index){
    var updatecountobj;
    if(filter.isOK(record)){
      updatecountobj = {count:0,original:null};
      lib.traverse(datahash,updateFrom.bind(null,updatecountobj,record));
      if(updatecountobj.count){
        if(!updatecountobj.original){
          throw new Error("No original");
        }
        updateobj.items.push({index: index, new:record, old:updatecountobj.original});
      }
      updatecountobj = null;
      record = null;
    }
  };
  MemoryStorageBase.prototype.doUpdate = function(filter,datahash,options,defer){
    var updateobj, travres;
    if(!this.data){
      defer.reject(new lib.Error('NO_DATA_IN_STORAGE'));
      return;
    }
    updateobj = {items:[]};
    travres = this._traverseData(this.processUpdate.bind(this,updateobj,filter,datahash,options));
    if (travres && q.isThenable(travres)) {
      travres.then(
        this.checkUpdateTraversal.bind(this, filter, datahash, options, defer, updateobj),
        defer.reject.bind(defer),
        console.log.bind(console, 'updateTraversal')
      );
      return;
    }
    this.checkUpdateTraversal(filter, datahash, options, defer, updateobj);
  };
  MemoryStorageBase.prototype.checkUpdateTraversal = function (filter, datahash, options, defer, updateobj) {
    var promises, ret;
    //console.log('checkUpdateTraversal', updateobj);
    if(updateobj.items.length<1 && options && options.upsert){
      this.processUpsert(defer,updateobj,filter,datahash,options);
      return;
    }
    promises = updateobj.items.reduce(this._finalizeUpdateOnItem.bind(this, defer), []);
    ret = promises.length>0 ? 
      q.all(promises).then(
        this.finalizeUpdate.bind(this, updateobj, defer)
      )
      :
      this.finalizeUpdate(updateobj, defer);
    updateobj = null;
    defer = null;
    return ret;
  };
  MemoryStorageBase.prototype.finalizeUpdate = function (updateobj, defer) {
    defer.resolve({updated:updateobj.items.length});
    defer = null;
  };
  MemoryStorageBase.prototype._finalizeUpdateOnItem = function (defer, result, item) {
    var r = this.finalizeUpdateOnItem(item, defer);
    if (q.isThenable(r)) {
      result.push(r);
    }
    return result;
  };
  MemoryStorageBase.prototype.finalizeUpdateOnItem = function (item, defer) {
    defer.notify([item.new, item.old]);
    item = null;
    defer = null;
  };
  MemoryStorageBase.prototype.processDelete = function(todelete,defer,filter,record,recordindex,records){
    if(filter.isOK(record)){
      if(this.events){
        this.events.recordDeleted.fire(record);
      }
      defer.notify(record);
      record.destroy();
      todelete.unshift(recordindex);
    }/*else{
      console.log('not deleting',record,'due to mismatch in',require('util').inspect(filter,{depth:null}));
    }*/
  };
  MemoryStorageBase.prototype.doDelete = function(filter,defer){
    var todelete, trr, ret;
    if (!this.data) {
      defer.resolve(0);
      return;
    }
    todelete = [];
    trr = this._traverseData(this.processDelete.bind(this,todelete,defer,filter));
    filter = null;
    ret = q.isThenable(trr) ?
      trr.then(
        this.onDeletionTraversal.bind(this, todelete, defer),
        defer.reject.bind(defer)
      )
      :
      this.onDeletionTraversal(todelete, defer);
    todelete = null;
    defer = null;
    return ret;
  };
  MemoryStorageBase.prototype.onDeletionTraversal = function (todelete, defer) {
    var promises, ret;
    promises = todelete.reduce(this._removeDataAtIndex.bind(this), []);
    ret = promises.length>0 ?
      q.all(promises).then(
        this.finalizeDelete.bind(this, todelete, defer),
        defer.reject.bind(defer)
      )
      :
      this.finalizeDelete(todelete, defer);
    todelete = null;
    defer = null;
    return ret;
  };
  MemoryStorageBase.prototype._removeDataAtIndex = function (result, index) {
    var r = this.removeDataAtIndex(index);
    if (q.isThenable(r)) {
      result.push(r);
    }
    return result;
  };
  MemoryStorageBase.prototype.finalizeDelete = function (todelete, defer) {
    defer.resolve(todelete.length);
    todelete = null;
    defer = null;
  };
  mylib.MemoryStorageBase = MemoryStorageBase;

}

module.exports = createMemoryStorageBase;
