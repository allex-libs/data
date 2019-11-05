function createDataManager(execlib, mylib){
  'use strict';
  var lib = execlib.lib,
    DataSource = mylib.DataSource,
    filterFactory = mylib.filterFactory,
    QueryBase = mylib.QueryBase,
    q = lib.q,
    qlib = lib.qlib;

  var __id = 0;
  function DataManager(storageinstance,filterdescriptor){
    this.id = process.pid + '_' + (++__id);
    DataSource.call(this);
    this.storage = storageinstance;
    this.filter = filterFactory.createFromDescriptor(filterdescriptor);
  }
  lib.inherit(DataManager,DataSource);
  DataManager.prototype.destroy = function(){
    if (this.filter) {
      this.filter.destroy();
    }
    this.filter = null;
    if (this.storage) {
      this.storage.destroy();
    }
    this.storage = null;
  };
  DataManager.prototype.onStorageError = function(defer,reason){
    //console.log('DataManager has no idea about what to do with',reason,'(onStorageError)');
    defer.reject(reason);
  };
  DataManager.prototype.doNativeCreate = function(defer,datahash){
    DataSource.prototype.create.call(this,datahash);
    defer.resolve(datahash);
  };
  DataManager.prototype.create = function(datahash, defer){
    defer = defer || lib.q.defer();
    if (!this.storage) {
      defer.reject(new lib.Error('MANAGER_ALREADY_DESTROYED', 'DataManager is destroyed already'));
      return defer.promise;
    }
    this.checkPrimaryKeyViolation(datahash).then(
      this.createOnStorage.bind(this, datahash, defer),
      defer.reject.bind(defer)
    );
    return defer.promise;
  }
  DataManager.prototype.createOnStorage = function (datahash, defer) {
    this.storage.create(datahash).done(
      this.doNativeCreate.bind(this,defer),
      this.onStorageError.bind(this,defer)
    );
    return defer.promise;
  };
  DataManager.prototype.onReadOne = function(defer,startreadrecord,datahash){
    var item = this.Coder.prototype.readOne.call(this,startreadrecord,datahash);
    if(defer){
      defer.notify(item);
    }else{
      this.handleStreamItem(item);
    }
  };
  DataManager.prototype.onReadDone = function(defer,startreadrecord){
    var item = this.Coder.prototype.endRead.call(this,startreadrecord);
    if(defer){
      defer.notify(item);
      defer.resolve(null);
    }else{
      this.handleStreamItem(item);
    }
  };
  DataManager.prototype.read = function(query,defer){
    if (!this.storage) {
      if (defer) {
        defer.reject(new lib.Error('MANAGER_ALREADY_DESTROYED', 'DataManager is destroyed already'));
      }
      return;
    }
    var startreadrecord = this.Coder.prototype.startRead.call(this);
    if(defer){
      defer.notify(startreadrecord);
    }else{
      this.handleStreamItem(startreadrecord);
    }
    this.storage.read(query).done(
      this.onReadDone.bind(this,defer,startreadrecord),
      this.onStorageError.bind(this, defer),
      this.onReadOne.bind(this,defer,startreadrecord)
    );
  };
  DataManager.prototype.doNativeUpdateExact = function(defer,ueobj){
    var item = this.Coder.prototype.updateExact.call(this,ueobj);
    if(item){
      this.handleStreamItem(item);
      defer.notify(item);
    }
  };
  DataManager.prototype.doNativeUpdate = function(defer,filter,datahash,res){
    if(res){
      var item = this.Coder.prototype.update.call(this,filter,datahash);
      if(item){
        this.handleStreamItem(item);
      }
    }
    defer.resolve(res);
  };
  DataManager.prototype.update = function(filterdescriptor,datahash,options, defer){
    var f;
    defer = defer || lib.q.defer();
    if (!this.storage) {
      defer.reject(new lib.Error('MANAGER_ALREADY_DESTROYED', 'DataManager is destroyed already'));
      return defer.promise;
    }
    f = filterFactory.createFromDescriptor(filterdescriptor);
    if(!f){
      var e = new lib.Error('INVALID_FILTER_DESCRIPTOR');
      e.filterdescriptor = filterdescriptor;
      defer.reject(e);
      return defer.promise;
    }
    this.storage.update(f,datahash,options).done(
      this.doNativeUpdate.bind(this,defer,f,datahash),
      this.onStorageError.bind(this, defer),
      this.doNativeUpdateExact.bind(this,defer)
    );
    return defer.promise;
  };
  DataManager.prototype.doNativeDelete = function(defer,filter,res){
    if(res){
      var item = this.Coder.prototype.delete.call(this,filter);
      if(item){
        this.handleStreamItem(item);
      }
    }
    defer.resolve(res);
  };
  DataManager.prototype.delete = function(filterdescriptor, defer){
    var f;
    defer = defer || lib.q.defer();
    if (!this.storage) {
      defer.reject(new lib.Error('MANAGER_ALREADY_DESTROYED', 'DataManager is destroyed already'));
      return defer.promise;
    }
    f = filterFactory.createFromDescriptor(filterdescriptor);
    if(!f){
      var e = new lib.Error('INVALID_FILTER_DESCRIPTOR');
      e.filterdescriptor = filterdescriptor;
      defer.reject(e);
      return;
    }
    this.storage.delete(f).done(
      this.doNativeDelete.bind(this, defer,f),
      this.onStorageError.bind(this, defer)
    );
    return defer.promise;
  };
  DataManager.prototype.stateStreamFilterForRecord = function(record){
    return this.storage.__record.stateStreamFilterForRecord(this,record);
  };

  DataManager.prototype.aggregate = function (aggregation_descriptor, defer) {
    defer = defer || lib.q.defer();
    if (!this.storage) {
      defer.reject(new lib.Error('MANAGER_ALREADY_DESTROYED', 'DataManager is destroyed already'));
      return defer.promise;
    }
    qlib.promise2defer (this.storage.aggregate (aggregation_descriptor), defer);
    return defer.promise;
  };

  //PK checks follow
  function r1appender (recs, item) {
    if (lib.isArray(item) && item[0] === 'r1') {
      recs.push(item[2]);
    }
  }
  DataManager.prototype.checkPrimaryKeyViolation = function (datahash) {
    var d, qry, recs, ret;
    if (!(this.storage && this.storage.__record)) {
      return q(true);
    }
    if (this.storage.__record.primaryKey) {
      d = q.defer();
      recs = [];
      qry = new PKQuery(this.storage.__record.primaryKey, datahash);
      this.read(qry, d);
      ret = d.promise.then(
        this.onPKCheckRead.bind(this, qry, recs),
        null,
        r1appender.bind(null, recs)
      ); 
      recs = null;
      return ret;
    }
    return q(true);
  };

  DataManager.prototype.onPKCheckRead = function (qry, recs, ignore) {
    var ret;
    qry.destroy();
    qry = null;
    ret = (lib.isArray(recs) && recs.length>0) ? q.reject(new Error('PRIMARY_KEY_VIOLATION')) : q(true);
    recs = null;
    return ret;
  };

  function addField (fields, pkname) {
    fields.push({name: pkname});
  }
  function recorddesc (pk, datahash) {
    var ret = {
      fields: []
    }, _f = ret.fields;
    if (lib.isArray(pk)) {
      pk.forEach(addField.bind(null, _f));
      _f = null;
      return ret;
    }
    addField(ret.fields, pk);
    return ret;
  }
  function visiblefields (pk, datahash) {
    if (lib.isString(pk)) {
      return [pk];
    }
    return pk.slice();
  }
  function eqfilterproducer (datahash, pkitem) {
    return {
      op: 'eq',
      field: pkitem,
      value: datahash[pkitem]
    }
  };
  function filterdesc (pk, datahash) {
    var ret;
    if (lib.isArray(pk)) {
      return {
        op: 'and',
        filters: pk.map(eqfilterproducer.bind(null, datahash))
      };
    }
    return eqfilterproducer(datahash, pk);
  };
  function PKQuery (pk, datahash) {
    QueryBase.call(this, recorddesc(pk, datahash), visiblefields(pk, datahash));
    this.pkfilter = mylib.filterFactory.createFromDescriptor(filterdesc(pk, datahash));
  }
  lib.inherit(PKQuery, QueryBase);
  PKQuery.prototype.destroy = function () {
    if (this.pkfilter) {
      this.pkfilter.destroy();
    }
    QueryBase.prototype.destroy.call(this);
  };
  PKQuery.prototype.filter = function () {
    return this.pkfilter;
  };
  PKQuery.prototype.limit = lib.dummyFunc;
  PKQuery.prototype.offset = lib.dummyFunc;
  //PK checks end

  mylib.DataManager = DataManager;
}

module.exports = createDataManager;
