(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
var lR = ALLEX.execSuite.libRegistry;
lR.register('allex_datalib',require('./libindex')(
  ALLEX,
  lR.get('allex_datafilterslib')
));

},{"./libindex":5}],2:[function(require,module,exports){
function createDataCoder(execlib){
  'use strict';
  var lib = execlib.lib,
      uid = lib.uid;

  function DataCoder(){
  }
  DataCoder.prototype.destroy = execlib.lib.dummyFunc;
  DataCoder.prototype.create = function(datahash){
    return ['c', datahash];
    /*
    return {
      o: 'c',
      d: datahash
    };
    */
  };
  DataCoder.prototype.startRead = function(){
    return ['rb', uid()];
    /*
    return {
      o: 'rb',
      d: uid()
    };
    */
  };
  DataCoder.prototype.readOne = function(startreadrecord,datahash){
    return ['r1', startreadrecord[1], datahash];
    /*
    return {
      o: 'r1',
      id: startreadrecord.d,
      d: datahash
    };
    */
  };
  DataCoder.prototype.endRead = function(startreadrecord){
    return ['re', startreadrecord[1]];
    /*
    return {
      o: 're',
      d: startreadrecord.d
    };
    */
  };
  DataCoder.prototype.read = function(arrayofhashes){
    return ['r', arrayofhashes];
    /*
    return {
      o: 'r',
      d: arrayofhashes
    };
    */
  };
  DataCoder.prototype.update = function(filter,datahash){
    return ['u', filter.descriptor(), datahash];
    /*
    return {
      o: 'u',
      f:filter.descriptor(),
      d:datahash
    };
    */
  };
  DataCoder.prototype.updateExact = function(updateexactobject){
    return ['ue', updateexactobject[0], updateexactobject[1]];
    /*
    if(!('o' in updateexactobject && 'n' in updateexactobject)){
      throw new Error("Bad updateExact");
    }
    return {
      o: 'ue',
      d: updateexactobject
    };
    */
  };
  DataCoder.prototype.delete = function(filter){
    return ['d', filter.descriptor()];
    /*
    return {
      o: 'd',
      d: filter.descriptor()
    };
    */
  };
  return DataCoder;
}

module.exports = createDataCoder;

},{}],3:[function(require,module,exports){
function createDataDecoder(execlib, mylib){
  'use strict';
  var lib = execlib.lib,
      q = lib.q,
      filterFactory = mylib.filterFactory;

  //On any Errors from storable
  //Decoder will destroy self
  //and suppress the Error
  function Decoder(storable){
    this.storable = storable;
    this.queryID = null;
    this.destroyer = this.destroy.bind(this);
  }
  function destroyer (qi) {
    if (qi.destroy) {
      qi.destroy();
    }
  }
  Decoder.prototype.destroy = function(){
    this.destroyer = null;
    this.queryID = null;
    this.storable = null;
  };
  Decoder.prototype.onStream = function(item){
    //console.log('Decoder', this.storable.__id,'got',item);
    //console.log('Decoder got',require('util').inspect(item,{depth:null}));
    switch(item[0]){
      case 'i':
        this.setID(item[1]);
        break;
      case 'rb':
        this.beginRead(item[1]);
        break;
      case 're':
        this.endRead(item[1]);
        break;
      case 'r1':
        this.readOne(item[2]);
        break;
      case 'c':
        this.create(item[1]);
        break;
      case 'ue':
        this.updateExact(item[1], item[2]);
        break;
      case 'u':
        this.update(item[1], item[2]);
        break;
      case 'd':
        this.delete(item[1]);
        break;
    }
  };
  Decoder.prototype.setID = function (id) {
    if (!this.storable) {
      return;
    }
    this.queryID = id;
    return lib.q(true);
  };
  Decoder.prototype.beginRead = function(itemdata){
    if (!this.storable) {
      return;
    }
    return this.storable.beginInit(itemdata).then(null, this.destroyer);
  };
  Decoder.prototype.endRead = function(itemdata){
    if (!this.storable) {
      return;
    }
    return this.storable.endInit(itemdata).then(null, this.destroyer);
  };
  Decoder.prototype.readOne = function(itemdata){
    if (!this.storable) {
      return;
    }
    return this.storable.create(itemdata).then(null, this.destroyer);
  };
  Decoder.prototype.create = function(itemdata){
    if (!this.storable) {
      return;
    }
    return this.storable.create(itemdata).then(null, this.destroyer);
  };
  Decoder.prototype.delete = function(itemdata){
    var f;
    if (!this.storable) {
      return;
    }
    f = filterFactory.createFromDescriptor(itemdata);
    if(!f){
      console.error('NO FILTER FOR',itemdata);
      return lib.q(true);
    }else{
      //console.log(this.storable,this.storable.delete.toString(),'will delete');
      return this.storable.delete(f).then(null, this.destroyer);
    }
  };
  Decoder.prototype.updateExact = function(newitem, olditem){
    var f;
    if (!this.storable) {
      return;
    }
    f = filterFactory.createFromDescriptor({op:'hash',d:olditem});
    return this.storable.update(f,newitem).then(null, this.destroyer);
  };
  Decoder.prototype.update = function(filter, datahash){
    var f;
    if (!this.storable) {
      return;
    }
    f = filterFactory.createFromDescriptor(filter);
    return this.storable.update(f,datahash).then(null, this.destroyer);
  };
  return Decoder;
}

module.exports = createDataDecoder;

},{}],4:[function(require,module,exports){
function createDataDistributor(execlib){
  'use strict';
  var lib = execlib.lib,
    execSuite = execlib.execSuite,
    StreamDistributor = execSuite.StreamDistributor;

  var dsdid = 0;
  function DataStreamDistributor(){
    //this.id = ++dsdid;
    StreamDistributor.call(this);
  }
  lib.inherit(DataStreamDistributor,StreamDistributor);
  DataStreamDistributor.prototype.attach = function(sink){
    //console.log(this.id,'attaching');
    StreamDistributor.prototype.attach.call(this,sink);
  };
  DataStreamDistributor.prototype.onStream = function(item){
    //console.log(this.id,'distributing',item,'to',this.sinks.length);
    StreamDistributor.prototype.onStream.call(this,item);
  };
  DataStreamDistributor.prototype.doTrigger = function(item,sink){
    if(!item){
      return;
    }
    if(!sink.destroyed){
      console.log('skipping an already destroyed sink',sink.__id);
      return;
    }
    StreamDistributor.prototype.doTrigger.call(this,item,sink);
  };
  return DataStreamDistributor;
}

module.exports = createDataDistributor;

},{}],5:[function(require,module,exports){
function createDataLib(execlib, datafilterslib){
  'use strict';
  var execSuite = execlib.execSuite,
    mylib = {
      storageRegistry: new execSuite.RegistryBase(),
      filterFactory: datafilterslib
    };
  require('./objectcreator')(execlib, mylib);
  require('./record')(execlib, mylib);
  require('./utils')(execlib, mylib);
  require('./query')(execlib, mylib);
  var DataCoder = require('./codercreator')(execlib),
      DataDecoder = require('./decodercreator')(execlib, mylib),
      streamSourceCreator = execSuite.streamSourceCreator;
  mylib.DataSource = streamSourceCreator(DataCoder);
  mylib.DataDecoder = DataDecoder;
  mylib.StreamDistributor = require('./distributorcreator')(execlib);
  require('./managers')(execlib, mylib);
  require('./storage')(execlib, mylib, datafilterslib);

  execlib.execSuite.taskRegistry.register('allex_datalib', require('./taskcreator')(execlib, mylib));

  return mylib;
}

module.exports = createDataLib;

},{"./codercreator":2,"./decodercreator":3,"./distributorcreator":4,"./managers":8,"./objectcreator":10,"./query":13,"./record":16,"./storage":23,"./taskcreator":29,"./utils":37}],6:[function(require,module,exports){
(function (process){
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

}).call(this,require('_process'))
},{"_process":38}],7:[function(require,module,exports){
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

},{}],8:[function(require,module,exports){
function createManagers (execlib, mylib) {
  'use strict';

  require('./creator')(execlib, mylib);
  require('./distributedcreator')(execlib, mylib);
  require('./spawningcreator')(execlib, mylib);
}

module.exports = createManagers;

},{"./creator":6,"./distributedcreator":7,"./spawningcreator":9}],9:[function(require,module,exports){
function createSpawningDataManager(execlib, mylib) {
  'use strict';
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
    DistributedDataManager = mylib.DistributedDataManager,
    JobBase = qlib.JobBase;

  function EventQ(target){
    lib.Destroyable.call(this);
    this.target = target;
    this.q = new lib.Fifo();
  }
  lib.inherit(EventQ,lib.Destroyable);
  EventQ.prototype.__cleanUp = function(){
    this.dump();
    this.q.destroy();
    this.q = null;
    this.target = null;
    lib.Destroyable.prototype.__cleanUp.call(this);
  };
  EventQ.prototype.isOK = function(item){
    //let's accept all until the channel reads out initial data
    //and then let the channel decide upon these events
    return true; 
  };
  EventQ.prototype.onStream = function(item){
    if (!this.target) {
      return;
    }
    if (!this.target.destroyed) {
      this.destroy();
      return;
    }
    this.q.push(item);
  };
  EventQ.prototype.dump = function(){
    if (!this.q) {
      return;
    }
    //console.log('EventQ dumping', this.q.length, 'items');
    this.q.drain(this.drainer.bind(this));
  };
  EventQ.prototype.drainer = function (item) {
    switch (item[0]) {
      case 'c':
        /*
         * this event will be received by the target
         * in the form of r1
        if(this.target.isOK(item[1])){
          this.target.onStream(item);
        }
        */
        break;
      default:
        this.target.onStream(item);
    }
  };

  function QueryRunner(runningquery, prophash, defer) {
    Destroyable.call(this);
    JobBase.call(this, defer);
    QueryClone.call(this, runningquery);
    this.result = true;//for the JobBase
    this.singleshot = prophash.singleshot;
    this.continuous = prophash.continuous;
    this.pagesize = prophash.pagesize;
    this.page = 0;
  }
  lib.inherit(QueryRunner, Destroyable);
  lib.inheritMethods(QueryRunner, JobBase, 'resolve', 'reject', 'notify');
  lib.inheritMethods(QueryRunner, QueryClone, 'filter',/*'limit','offset',*/'isEmpty','isLimited','isOffset','isOK');
  QueryRunner.prototype.__cleanUp = function () {
    this.page = null;
    this.pagesize = null;
    this.continuous = null;
    this.singleshot = null;
    QueryClone.prototype.destroy.call(this);
    JobBase.prototype.destroy.call(this);
  };
  QueryRunner.prototype.onStream = function (item) {
    var i  = QueryClone.prototype.onStream.call(this,item);
    //console.log(process.pid+'', 'Runner', this.filter(), 'onStream', i);
    //console.log(item, '=>', i);
    if (i) {
      this.notify(i);
    }
  };
  QueryRunner.prototype.limit = function () {
    return this.pagesize;
  };
  QueryRunner.prototype.offset = function () {
    if (this.pagesize) {
      return this.pagesize*this.page;
    }
  };

  //function RunningQuery(recorddescriptor, filterdescriptor, visiblefields) {
  function RunningQuery(recorddescriptor, queryprophash) {
    ComplexDestroyable.call(this);
    QueryBase.call(this, recorddescriptor, queryprophash.visiblefields);
    this.distributor = new StreamDistributor();
    this._filter = filterFactory.createFromDescriptor(queryprophash.filter);
    this._limit = queryprophash.limit;
    this._offset = queryprophash.offset;
  }
  lib.inherit(RunningQuery, ComplexDestroyable);
  lib.inheritMethods(RunningQuery, QueryBase, /*'limit','offset',*/'isEmpty','isLimited','isOffset','isOK','processUpdateExact');
  RunningQuery.prototype.__cleanUp = function () {
    this._offset = null;
    this._limit = null;
    if (this._filter) {
      this._filter.destroy();
    }
    this._filter = null;
    if (this.distributor) {
      this.distributor.destroy();
    }
    this.distributor = null;
    QueryBase.prototype.destroy.call(this);
  };
  RunningQuery.prototype.dyingCondition = function () {
    if (!this.distributor) {
      return true;
    }
    if (!this.distributor.sinks) {
      return true;
    }
    return this.distributor.sinks.length < 1;
  };
  RunningQuery.prototype.startTheDyingProcedure = function () {
    if (this.distributor) {
      this.distributor.destroy();
    }
    this.distributor = null;
  };
  RunningQuery.prototype.filter = function(){
    return this._filter;
  };
  RunningQuery.prototype.limit = function () {
    return this._limit;
  };
  RunningQuery.prototype.offset = function () {
    return this._offset;
  };
  /*
  RunningQuery.prototype.limit = lib.dummyFunc;
  RunningQuery.prototype.offset = lib.dummyFunc;
  */
  RunningQuery.prototype.addRunner = function (manager, runner) {
    if (!runner) {
      return;
    }
    if (!runner.destroyed) {
      return;
    }
    var d = lib.q.defer(),
      eventq = new EventQ(runner);
    this.distributor.attach(eventq);
    eventq.destroyed.attachForSingleShot(this.checkForDying.bind(this));
    d.promise.done(
      this.onRunnerInitiated.bind(this,eventq),
      runner.reject.bind(runner),
      runner.onStream.bind(runner)
    );
    manager.read(this, d);
    d = null;
    eventq = null;
  };
  RunningQuery.prototype.onRunnerInitiated = function (eventq) {
    var runner = eventq.target;
    eventq.dump();
    if (!runner) {
      eventq.destroy();
      eventq = null;
      return;
    }
    if (runner.singleshot || !runner.continuous) {
      runner.resolve(true);
      eventq.destroy();
      eventq = null;
      return;
    }
    if (!this.distributor) {
      runner.resolve(true);
      eventq.destroy();
      eventq = null;
      return;
    }
    this.distributor.attach(runner);
    runner.destroyed.attachForSingleShot(this.checkForDying.bind(this)); //make a this.maybedier = this.maybeDie.bind(this); in the ctor
    eventq.destroy();
    eventq = null;
  };
  RunningQuery.prototype.onStream = function (item) {
    var i;
    if (this.distributor) {
      i = QueryBase.prototype.onStream.call(this,item);
      if (i) {
        this.distributor.onStream(i);
      }
    }
  };
  RunningQuery.prototype.checkForDying = function () {
    if (this.dyingCondition()) {
      this.destroy();
    }
  };

  function SpawningDataManager(storageinstance, filterdescriptor, recorddescriptor) {
    DistributedDataManager.call(this, storageinstance, filterdescriptor);
    this.recorddescriptor = recorddescriptor;
    this.runningQueries = new lib.DIContainer();
    //console.trace();
    //console.log('new SpawningDataManager', this.id);
  }
  lib.inherit(SpawningDataManager, DistributedDataManager);
  SpawningDataManager.prototype.destroy = function () {
    this.recorddescriptor = null;
    if (this.runningQueries) {
      this.runningQueries.destroyDestroyables();
      this.runningQueries.destroy();
    }
    this.runningQueries = null;
    DistributedDataManager.prototype.destroy.call(this);
  };
  /*
  * queryprophash keys: filter, singleshot, continuous
  */
  SpawningDataManager.prototype.addQuery = function (id, queryprophash, defer) {
    if (!queryprophash) {
      defer.reject(new lib.Error('NO_QUERY_PROPERTY_HASH'));
      return;
    }
    var rqidentifier = JSON.stringify(queryprophash),//JSON.stringify(queryprophash.filter ? queryprophash.filter : '*'),
      rq = this.runningQueries.get(rqidentifier),
      qr;
    //console.log(this.id, 'reading', this.storage.data, 'on', queryprophash.filter);
    if (!rq) {
      //rq = new RunningQuery(this.recorddescriptor, queryprophash.filter, queryprophash.visiblefields);
      rq = new RunningQuery(this.recorddescriptor, queryprophash);
      this.runningQueries.registerDestroyable(rqidentifier, rq);
      this.distributor.attach(rq);
    }
    defer.notify(['i', id]);
    qr = new QueryRunner(rq, queryprophash, defer);
    rq.addRunner(this, qr);
    return qr;
  };

  mylib.SpawningDataManager = SpawningDataManager;
}

module.exports = createSpawningDataManager;

},{}],10:[function(require,module,exports){
function createDataObject(execlib, mylib){
  'use strict';
  var lib = execlib.lib;
  function DataObject(prophash){
    Object.getOwnPropertyNames(prophash).forEach(this._hashToField.bind(this,prophash));
  }
  DataObject.prototype._hashToField = function(hash,fieldname){
    this.set(fieldname,hash[fieldname]);
  };
  DataObject.prototype._fieldToHash = function(hash,fieldname){
    var val = this.get(fieldname), und;
    if(val!==und){
      hash[fieldname] = val;
    }
    return hash;
  };
  function undefize(o,name){
    o.set(name,void 0);
  }
  DataObject.prototype.destroy = function(){
    /*
    var opns = Object.getOwnPropertyNames(this);
    opns.forEach(undefize.bind(null,this));
    console.trace();
    console.log(this,'destroyed');
    */
  };
  DataObject.prototype.templateHash = function () {
    return {};
  };
  DataObject.prototype.toHash = function(fields){
    //return fields.reduce(this._fieldToHash.bind(this),this.templateHash());
    var ret = this.templateHash(), l = fields.length, f, val, und;
    for (var i=0; i<l; i++) {
      f = fields[i];
      val = this.get(f);
      if (val!==und) {
        ret[f] = val;
      }
    }
    return ret;
  };
  DataObject.prototype.clone = function(){
    return this.toHash(Object.getOwnPropertyNames(this));
  };
  function equalator(o1,o2,propname){
    return o1[propname] === o2[propname];
  }
  function compareObjects(o1,o2){
    var o1pns = Object.getOwnPropertyNames(o1),
        o2pns = Object.getOwnPropertyNames(o2),
        ret;
    if(o1pns.length!==o2pns.length){
      return false;
    }
    if(o1pns.length<1){
      return true;
    }
    ret = o1pns.every(equalator.bind(null,o1,o2));
    o1 = null;
    o2 = null;
    return ret;
  }
  DataObject.prototype.matchesField = function(datahash,fieldname){
    var d = datahash[fieldname],
        f = this.get(fieldname),
        tod = typeof d,
        tof = typeof f;
    if(tod!==tof){
      return false;
    }
    if(tod === 'object'){
      if(d===null){
        return f===null;
      }else if(f===null){
        return d!==null;
      }
      if(d instanceof Array){
        if(!(f instanceof Array)){
          return false;
        }
        return compareArrays(d,f);
      }
      return compareObjects(d,f);
    }
    return datahash[fieldname] === this.get(fieldname);
  };
  DataObject.prototype.matches = function(datahash){
    var ret = this.fieldNames().every(this.matchesField.bind(this,datahash));
    datahash = null;
    return ret;
  };
  //the following methods are for override
  DataObject.prototype.fieldNames = function(){
    return Object.getOwnPropertyNames(this);
  };
  DataObject.prototype.hasFieldNamed = function(fieldname){
    return this.hasOwnProperty(fieldname);
  };
  DataObject.prototype.set = function(name,val){
    this[name] = val;
  };
  DataObject.prototype.get = function(name){
    return this[name];
  };
  //return DataObject;

  function recordFieldMapper(f) { return "this."+f.name+" = null;"; }
  function createRecordObjectCtor (fields) {
    var ret, fs = fields.map(recordFieldMapper).join("\n"),
      ctorcode = "ret = function DataObject_(prophash) {\n"+fs+"\n DataObject.call(this, prophash);\n};\nlib.inherit(ret, DataObject);",
      hashtemplate = createHashTemplate(fields);
    eval(ctorcode);
    ret.prototype.templateHash = function (){
      var ret;
      eval(hashtemplate);
      return ret;
    };
    return ret;
  }

  function RecordHiveElement (fid, fields) {
    this.id = fid;
    this.ctor = createRecordObjectCtor(fields);
    this.template = createHashTemplate(fields);
  }
  RecordHiveElement.prototype.destroy = function () {
    this.template = null;
    this.ctor = null;
    this.id = null;
  };

  function templateFieldMapper (f) {
    return f.name+": void 0";
  }
  function createHashTemplate (fields) {
    var fs = fields.map(templateFieldMapper);
    return "ret = {" + fs.join(',')+"}";
  }

  function hiveFieldConcatenator(res, f) { return res + '_' + f.name; }
  function fieldsid (fields) {
    return fields.reduce(hiveFieldConcatenator, '');
  };
  function RecordHive () {
    lib.Map.call(this);
  }
  lib.inherit(RecordHive, lib.Map);
  RecordHive.prototype.give = function (fields) {
    var fid = fieldsid(fields),
      ret = this.get(fid);
    if (!ret) {
      ret = new RecordHiveElement(fid, fields);
      this.add(fid, ret);
    }
    return ret;
  };
  RecordHive.prototype.dec = function (templateobject) {
    if (!(templateobject && templateobject.fid)) {
      return;
    }
    templateobject = this.remove(templateobject.fid);
    if (templateobject) {
      templateobject.destroy();
      templateobject = null;
    }
  };
  
  //var _recordHive = new RecordHive();
  mylib.ObjectHive = new RecordHive();
}

module.exports = createDataObject;

},{}],11:[function(require,module,exports){
function createQueryBase(execlib, mylib){
  'use strict';
  function QueryBase(recorddescriptor,visiblefields){
    /*
    console.trace();
    console.log('new QueryBase');
    */
    this.record = new (mylib.recordSuite.Record)(recorddescriptor,visiblefields);
  };
  QueryBase.prototype.destroy = function(){
    this.record.destroy();
    this.record = null;
  };
  QueryBase.prototype.filter = function(){
    throw new Error("Generic QueryBase does not implement the filter method");
  };
  QueryBase.prototype.limit = function(){
    throw new Error("Generic QueryBase does not implement the limit method");
  }
  QueryBase.prototype.offset = function(){
    throw new Error("Generic QueryBase does not implement the offset method");
  };
  QueryBase.prototype.isEmpty = function(){
    return this.limit===0 || this.record.isEmpty();
  };
  QueryBase.prototype.isLimited = function(){
    var limit = this.limit();
    return ('number' === typeof limit) && limit>0 && limit<Infinity;
  };
  QueryBase.prototype.isOffset = function(){
    var offset = this.offset();
    return ('number' === typeof offset) && offset!==0;
  };
  QueryBase.prototype.isOK = function(datahash){
    var flt = this.filter();
    return flt ? flt.isOK(datahash) : true;
  };
  QueryBase.prototype.processUpdateExact = function(original,_new){
    var ook = original && this.isOK(original),
        _nok = this.isOK(_new),
        uf;
    if(ook){
      uf = this.record.updatingFilterDescriptorFor(original);
      if(_nok){
        //update
        return ['u', uf, _new];
      }else{
        //deletion
        return ['d', uf];
      }
    }else{
      if(_nok){
        //create
        return ['c', _new];
      }else{
        //nothing
      }
    }
  };
  QueryBase.prototype.onStream = function(item){
    /*
    console.trace();
    console.log('Query onStream',item);
    */
    if (!this.record) {
      return null;
    }
    switch(item[0]){
      case 'r1':
        if(this.isOK(item[2])){
          return [item[0], item[1], this.record.filterHash(item[2])];
        }/* else {
          console.log(this.filter(), 'says', item[2], 'is NOT OK');
        }*/
        break;
      case 'c':
        if(this.isOK(item[1])){
          return [item[0], this.record.filterHash(item[1])];
        }
        break;
      case 'ue':
        return this.processUpdateExact(item[2],item[1]);
      default:
        return item;
    }
  };
  mylib.QueryBase = QueryBase;
}

module.exports = createQueryBase;

},{}],12:[function(require,module,exports){
function createQueryClone(execlib,mylib){
  'use strict';
  var lib = execlib.lib;
  var QueryBase = mylib.QueryBase;

  function QueryClone(original){
    QueryBase.call(this,{fields:[]},[]);
    this.record.destroy();
    this.record = original.record;
    this.original = original;
    if(!this.original){
      throw new lib.Error('NO_ORIGINAL_PROVIDED_TO_QUERY_CLONE');
    }
    if('function' !== typeof this.original.filter){
      var e = new lib.Error('ORIGINAL_FOR_QUERY_CLONE_IS_NOT_A_QUERY');
      e.original = original;
      throw e;
    }
  };
  execlib.lib.inherit(QueryClone,QueryBase);
  QueryClone.prototype.destroy = function(){
    this.original = null;
    this.record = null;
    //QueryBase.prototype.destroy.call(this); //not this, it would destroy the original record
  };
  QueryClone.prototype.filter = function(){
    return this.original ? this.original.filter() : null;
  };
  QueryClone.prototype.limit = function(){
    return this.original ? this.original.limit() : 0;
  }
  QueryClone.prototype.offset = function(){
    return this.original ? this.original.offset() : 0;
  };
  mylib.QueryClone = QueryClone;
}

module.exports = createQueryClone;

},{}],13:[function(require,module,exports){
function createQueries (execlib, mylib) {
  'use strict';

  require('./basecreator')(execlib, mylib);
  require('./staticcreator')(execlib, mylib);
  require('./clonecreator')(execlib, mylib);
}

module.exports = createQueries;

},{"./basecreator":11,"./clonecreator":12,"./staticcreator":14}],14:[function(require,module,exports){
function createStaticQuery (execlib, mylib) {
  'use strict';

  var lib = execlib.lib,
    QueryBase = mylib.QueryBase,
    filterFactory = mylib.filterFactory;

  function StaticQuery(recorddescriptor, querydescriptor) {
    QueryBase.call(this, recorddescriptor, querydescriptor.visiblefields);
    this._filter = filterFactory.createFromDescriptor(querydescriptor.filter);
    this._limit = querydescriptor.limit;
    this._offset = querydescriptor.offset;
  }
  lib.inherit(StaticQuery, QueryBase);
  StaticQuery.prototype.destroy = function () {
    this._filter = null;
    this._limit = null;
    this._offset = null;
    QueryBase.prototype.destroy.call(this);
  };
  StaticQuery.prototype.filter = function(){
    return this._filter;
  };
  StaticQuery.prototype.limit = function () {
    return this._limit;
  };
  StaticQuery.prototype.offset = function () {
    return this._offset;
  };

  mylib.StaticQuery = StaticQuery;
}
module.exports = createStaticQuery;

},{}],15:[function(require,module,exports){
function createRecord(execlib, outerlib, mylib){
  'use strict';
  var lib = execlib.lib;

  function DefaultHandler(desc){
    var evaldesc;
    this.proc = null;
    this._value = desc;
    if(lib.isString(desc) && desc.length>4 && desc.indexOf('{{')===0 && desc.lastIndexOf('}}')===desc.length-2){
      evaldesc = desc.substring(2, desc.length-2);
      this.proc = function(destructionhash){
        if (destructionhash && destructionhash.__dodestroy===true) {
          evaldesc = null;
          return;
        }
        return eval(evaldesc);
      };
    }
    if('undefined' === typeof this._value){
      this._value = null;
    }
  }
  DefaultHandler.prototype.destroy = function(){
    if (this.proc) {
      this.proc({__dodestroy: true});
    }
    this.proc = null;
    this._value = null;
  };
  DefaultHandler.prototype.value = function(){
    if(this.proc){
      return this.proc();
    }
    return this._value;
  };

  function Field(prophash){
    this.name = prophash.name;
    if(!this.name){
      console.error(prophash);
      throw new Error("Field needs a name");
    }
    this.value = prophash.value;
    this.default = new DefaultHandler(prophash.default);
  }
  Field.prototype.destroy = function(){
    this.default.destroy();
    this.default = null;
    this.value = null;
    this.name = null;
  };
  Field.prototype.valueFor = function(val){
    var und;
    if(val===und){
      return this.default.value();
    }
    //TODO: validate
    return val;
  };

  function filterOut(sourcefields, visiblefields) {
    var ret = sourcefields.reduce(function (result, field) {
      if (visiblefields.indexOf(field.name) >= 0) {
        result.push(field);
      }
      return result;
    }, []);
    visiblefields = null;
    return ret;
  }

  function Record(p_prophash,visiblefields){
    var prophash = lib.extend({}, p_prophash);
    if(!(prophash && prophash.fields)){
      console.trace();
      throw new Error("Record needs the fields array in its property hash");
    }
    if (lib.isArray(visiblefields)) {
      prophash.fields = filterOut(prophash.fields, visiblefields);
    }
    this.primaryKey = prophash.primaryKey;
    this.templateObj = outerlib.ObjectHive.give(prophash.fields);
    //this.objCtor = prophash.objCtor || createRecordObjectCtor(prophash.fields);
    this.fields = [];
    this.fieldsByName = new lib.Map();
    //this.hashTemplate = createHashTemplate(prophash.fields);
    prophash.fields.forEach(this.addField.bind(this,visiblefields));
    visiblefields = null;
  }
  Record.prototype.destroy = function(){
    if (this.templateObj) {
      outerlib.ObjectHive.dec(this.templateObj);
    }
    //this.hashTemplate = null;
    this.fieldsByName.destroy();
    this.fieldsByName = null;
    lib.arryDestroyAll(this.fields);
    this.fields = null;
    //this.objCtor = null;
    this.templateObj = null;
    this.primaryKey = null;
  };
  Record.prototype.isEmpty = function(){
    return this.fields.length<1;
  };
  Record.prototype.addField = function(visiblefields,fielddesc){
    if(visiblefields && visiblefields.indexOf(fielddesc.name)<0){
      return;
    }
    var field = new Field(fielddesc);
    this.fields.push(field);
    this.fieldsByName.add(field.name,field);
  };
  Record.prototype.createTemplateHash = function () {
    var ret;
    try {
      eval (this.templateObj.template);
    } catch(e) {
      return {};
    }
    return ret;
  };
  function hashFiller(prophash, obj, field) {
    prophash[field.name] = field.valueFor(obj[field.name]);
  }
  Record.prototype.filterHash = function(obj){
    var prophash, fs, l, i, f, fn;//{};
    if (!this.fields) {
      return {};
    }
    prophash = this.createTemplateHash();
    fs = this.fields;
    l=fs.length;
    //this.fields.forEach(hashFiller.bind(null, prophash, obj));
    for(i=0; i<l; i++) {
      f = fs[i];
      fn = f.name;
      prophash[fn] = f.valueFor(obj[fn]);
    }
    obj = null;
    return prophash;
  };
  Record.prototype.filterObject = function(obj){
    return new(this.templateObj.ctor)(this.filterHash(obj));
  };
  function putter(fbn, ret, val, name) {
    var f = fbn.get(name);
    if(f) {
      ret[name] = f.valueFor(val);
    }
  }
  Record.prototype.filterOut = function(obj){
    var ret = {}, _r = ret;
    lib.traverseShallow(obj, putter.bind(null, this.fieldsByName, _r));
    _r = null;
    return ret;
  };
  Record.prototype.filterStateStream = function(item){
    if(item.p && item.p.length===1){
      if(item.o==='u'){
        var f = this.fieldsByName.get(item.p[0]);
        if(f){
          var ret = {};
          ret[f.name] = f.valueFor(item.d[0]);
          return ret;
        }
      }
      if(item.o==='s'){
        var f = this.fieldsByName.get(item.p[0]);
        if(f){
          var ret = {};
          ret[f.name] = f.valueFor(item.d);
          return ret;
        }
      }
    }
  };
  Record.prototype.stateStreamFilterForRecord = function(storage,record){
    return new StateStreamFilter(storage,record,this);
  };
  Record.prototype.updatingFilterDescriptorFor = function(datahash){
    var ret;
    if(this.primaryKey){
      if(lib.isArray(this.primaryKey)){
        ret = {op: 'and', filters : this.primaryKey.map(function(pkfield){
          return {
            op: 'eq', field: pkfield, value:datahash[pkfield]
          };
        })};
        datahash = null;
        return ret;
      }else{
        return {op:'eq',field:this.primaryKey,value:datahash[this.primaryKey]};
      }
    }else{
      return {op:'hash',d:this.filterObject(datahash)};
    }
  };
  Record.prototype.defaultFor = function(fieldname){
    var f = this.fieldsByName.get(fieldname);
    if(f){
      return f.valueFor();
    }else{
      return null;
    }
  };

  function StateStreamFilter(manager,recordinstance,record){
    this.manager = manager;
    this.recordinstance = recordinstance;
    this.record = record;
  }
  StateStreamFilter.prototype.destroy = function(){
    this.record = null;
    this.recordinstance = null;
    this.manager = null;
  };
  StateStreamFilter.prototype.onStream = function(item){
    var val = this.record.filterStateStream(item);
    if(val){
      this.manager.update(this.record.updatingFilterDescriptorFor(this.recordinstance),val, {op:'set'});
    }
  };
  mylib.Record = Record;
}

module.exports = createRecord;

},{}],16:[function(require,module,exports){
function createSuite(execlib, mylib){
  'use strict';

  var suite = {};
  require('./utils')(execlib,suite);

  require('./creator')(execlib, mylib, suite);
  
  mylib.recordSuite = suite;
};

module.exports = createSuite;

},{"./creator":15,"./utils":17}],17:[function(require,module,exports){
(function (process){
function createRecordUtils(execlib,suite){
  'use strict';
  var lib = execlib.lib;
  function selectFieldIfDuplicate(targetfieldname,foundobj,fieldnames,hash){
    var targetfieldvalue = hash[targetfieldname];
    if(targetfieldvalue in fieldnames){
      foundobj.found = hash[namefieldname];
      return true;
    }
    fieldnames[targetfieldvalue] = true;
  }

  function duplicateFieldValueInArrayOfHashes(fieldname,fieldnames,arrayofhashes){
    var foundobj = {},
      fieldChecker = selectFieldIfDuplicate.bind(fieldname,foundobj,fieldnames);
    for(var i=2; i<arguments.length; i++){
      console.log('checking',arguments[i]);
      arguments[i].some(fieldChecker);
      if(foundobj.found){
        return foundobj.found;
      }
    }
  }

  function checkIfInvalidRd(fieldnames,rd){
    if(!(rd && 'object' === typeof rd)){
      return "not an object";
    }
    if(!rd.fields){
      return "has no fields";
    }

  }

  function copyExceptFields(obj,item,itemname){
    if(itemname!=='fields'){
      obj[itemname] = item;
    }
  }
  function inherit(rd1,rd2){//rd <=> recorddescriptor
    var result = {fields:[]}, fn={};
    for(var i=0; i<arguments.length; i++){
      var rd = arguments[i], 
        invalid = checkIfInvalidRd(fn,rd);
      if(invalid){
        continue;
        //throw new Error((rd ? JSON.stringify(rd) : rd) + " is not a valid record descriptor: "+invalid);
      }
      lib.traverse(rd,copyExceptFields.bind(null,result));
      result.fields.push.apply(result.fields,rd.fields);
    }
    return result;
  }

  function pushIfNotInLookupArray(lookuparry,destarry,item){
    if(lookuparry.indexOf(item)<0){
      destarry.push(item);
    }
  }
  function copyAndAppendNewElements(a1,a2){
    var ret = a1.slice();
    if(lib.isArray(a2)){
      a2.forEach(pushIfNotInLookupArray.bind(null,a1,ret));
    }
    return ret;
  }
  suite.copyAndAppendNewElements = copyAndAppendNewElements;

  function sinkInheritProcCreator(classname,originalUIP){//originalUIP <=> original User inheritance proc
    //classname not used, but may be useful for error reporting...
    return function(childCtor,methodDescriptors,visiblefieldsarray){
      originalUIP.call(this,childCtor,methodDescriptors);
      childCtor.prototype.visibleFields = copyAndAppendNewElements(this.prototype.visibleFields,visiblefieldsarray);
      childCtor.inherit = this.inherit;
      //console.log('after inherit',childCtor.prototype.visibleFields,'out of parent',this.prototype.visibleFields,'and',visiblefieldsarray);
    };
  }

  function copierWOFields(dest,item,itemname){
    if(itemname==='fields'){
      return;
    }
    dest[itemname] = item;
  }
  function nameFinder(findobj,name,item){
    if(item && item.name===name){
      findobj.result = item;
      return true;
    }
  }
  function getNamedItem(arry,name){
    var findobj={result:null};
    arry.some(nameFinder.bind(null,findobj,name));
    return findobj.result;
  };
  function namedSetter(setitem,item,itemindex,arry){
    if(item && item.name===setitem.name){
      arry[itemindex] = setitem;
      return true;
    }
  }
  function setNamedItem(arry,item){
    if(!item){
      return;
    }
    if(!arry.some(namedSetter.bind(null,item))){
      arry.push(item);
    };
  };
  function copyNamedItems(src,dest,fieldnamesarry){
    if(!(lib.isArray(src) && lib.isArray(dest))){
      return;
    }
    fieldnamesarry.forEach(function(fn){
      var item = getNamedItem(src,fn);
      if(item){
        setNamedItem(dest,item);
      }
    });
  }
  suite.duplicateFieldValueInArrayOfHashes = duplicateFieldValueInArrayOfHashes;
  suite.inherit = inherit;

  execlib.execSuite.registry.clientSides.waitFor('.').then(
    doDaServerSide.bind(null, suite, sinkInheritProcCreator),
    baseWaiterFailer
  );

  function baseWaiterFailer (reason) {
    console.error('Waiting for the client side of the base Service failed');
    console.error(reason);
    process.exit(1);
  }

  function doDaServerSide (_suite, _sinkInheritProcCreator, sm) {
    var sinkPreInheritProc = _sinkInheritProcCreator('DataSink',sm.get('user').inherit); 
    _sinkInheritProcCreator = null;
    function sinkInheritProc(childCtor,methodDescriptors,visiblefieldsarray,classStorageDescriptor){
      sinkPreInheritProc.call(this,childCtor,methodDescriptors,visiblefieldsarray);
      var recordDescriptor = {};
      lib.traverseShallow(this.prototype.recordDescriptor,copierWOFields.bind(null,recordDescriptor));
      var fields = [];
      if(this.prototype.recordDescriptor){
        copyNamedItems(this.prototype.recordDescriptor.fields,fields,childCtor.prototype.visibleFields);
      }
      lib.traverseShallow(classStorageDescriptor.record, copierWOFields.bind(null,recordDescriptor));
      copyNamedItems(classStorageDescriptor.record.fields,fields,childCtor.prototype.visibleFields);
      recordDescriptor.fields = fields;
      childCtor.prototype.recordDescriptor = recordDescriptor;
    }
    _suite.sinkInheritProc = sinkInheritProc;
    _suite = null;
  }
}

module.exports = createRecordUtils;

}).call(this,require('_process'))
},{"_process":38}],18:[function(require,module,exports){
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

},{}],19:[function(require,module,exports){
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

},{}],20:[function(require,module,exports){
function createAsyncStorageMixin (execlib, mylib) {
  var lib = execlib.lib,
    q = lib.q;

  function AsyncStorageMixin () {
    this.q = new lib.Fifo();
    this.readyDefer = q.defer();
    this.readyDefer.promise.then(this.setReady.bind(this));
  }
  AsyncStorageMixin.prototype.destroy = function () {
    if (this.readyDefer) {
      this.readyDefer.reject(new lib.Error('ALREADY_DESTROYED', 'This instance of '+this.constructor.name+' is being destroyed'));
    }
    this.readyDefer = null;
    if (this.q) {
      this.q.destroy();
    }
    this.q = null;
    this.destroyBoundProtoMethods();
  };
  AsyncStorageMixin.prototype.setReady = function () {
    //console.log('setReady', this.q.length, 'jobs on q');
    if (this.q) {
      this.q.drain(this.jobApplier.bind(this));
    }
  };
  AsyncStorageMixin.prototype.jobApplier = function (job) {
    this[job[0]].apply(this, job[1]);
  };

  AsyncStorageMixin.addMethods = function (klass, baseklassofklass) {
    var baseprototype;
    if (!baseklassofklass) {
      throw new Error('addMethods of AsyncStorageMixin needs the second parameter, the base Class of the implementing Class');
    }
    lib.inheritMethods(klass, AsyncStorageMixin
      ,'setReady'
      ,'jobApplier'
    );
    baseprototype = baseklassofklass.prototype;
    klass.prototype.doCreate = function (record, defer) {
      if (!this.readyDefer) {
        return;
      }
      if (!this.readyDefer.promise.inspect().state === 'fulfilled') {
        this.q.push(['doCreate', [record, defer]]);
        return;
      }
      return baseprototype.doCreate.call(this, record, defer);
    };
    klass.prototype.doRead = function (query, defer) {
      if (!this.readyDefer) {
        return;
      }
      if (!this.readyDefer.promise.inspect().state === 'fulfilled') {
        this.q.push(['doRead', [query, defer]]);
        return;
      }
      return baseprototype.doRead.call(this, query, defer);
    };
    klass.prototype.doUpdate = function (filter, datahash, options, defer) {
      if (!this.readyDefer) {
        return;
      }
      if (!this.readyDefer.promise.inspect().state === 'fulfilled') {
        this.q.push(['doUpdate', [filter, datahash, options, defer]]);
        return;
      }
      return baseprototype.doUpdate.call(this, filter, datahash, options, defer);
    };
    klass.prototype.doDelete = function (filter, defer) {
      if (!this.readyDefer) {
        return;
      }
      if (!this.readyDefer.promise.inspect().state === 'fulfilled') {
        this.q.push(['doDelete', [filter, defer]]);
        return;
      }
      return baseprototype.doDelete.call(this, filter, defer);
    };
    klass.prototype.destroyBoundProtoMethods = function () {
      baseprototype = null;
    };
  };
  mylib.AsyncStorageMixin = AsyncStorageMixin;
}

module.exports = createAsyncStorageMixin;

},{}],21:[function(require,module,exports){
function createStorageBase(execlib, mylib){
  'use strict';
  var lib = execlib.lib,
    q = lib.q,
    Record = mylib.recordSuite.Record,
    qlib = lib.qlib,
    JobBase = qlib.JobBase;

  function StorageBaseEventing(){
    this.initTxnId = null;
    this.initiated = new lib.HookCollection();
    this.created = new lib.HookCollection();
    this.newRecord = new lib.HookCollection();
    this.updated = new lib.HookCollection();
    this.recordUpdated = new lib.HookCollection();
    this.deleted = new lib.HookCollection();
    this.recordDeleted = new lib.HookCollection();
  }
  StorageBaseEventing.prototype.destroy = function(){
    this.recordDeleted.destruct();
    this.recordDeleted = null;
    this.deleted.destruct();
    this.deleted = null;
    this.recordUpdated.destruct();
    this.recordUpdated = null;
    this.updated.destruct();
    this.updated = null;
    this.newRecord.destruct();
    this.newRecord = null;
    this.created.destruct();
    this.created = null;
    this.initiated.destruct();
    this.initiated = null;
    this.initTxnId = null;
  };
  StorageBaseEventing.prototype.beginInit = function(txnid){
    if(this.initTxnId){
      var e = new Error('E_DATASTORAGE_ALREADY_IN_INITIATION');
      e.txnInProgress = this.initTxnId;
      e.newTxn = txnid;
      throw e;
    }
    this.initTxnId = txnid;
  };
  StorageBaseEventing.prototype.endInit = function(txnid,storage){
    if(!this.initTxnId){
      var e = new Error('E_DATASTORAGE_NOT_IN_INITIATION');
      e.txnId = txnid;
      throw e;
    }
    if(this.initTxnId!==txnid){
      var e = new Error('E_DATASTORAGE_INITIATION_END_MISMATCH');
      e.txnInProgress = this.initTxnId;
      e.endTxnId = txnid;
      throw e;
    }
    this.initTxnId = null;
    this.initiated.fire(storage);
  };
  StorageBaseEventing.prototype.fireNewRecord = function(datahash){
    if (!this.created) {
      return;
    }
    this.created.fire(datahash);
    if(!this.initTxnId){
      this.newRecord.fire(datahash);
    }
  };
  StorageBaseEventing.prototype.fireUpdated = function(filter,datahash,updateresult){
    if(this.updated && updateresult && (updateresult.updated || updateresult.upserted)){
      this.updated.fire(filter,datahash,updateresult);
    }
  };
  StorageBaseEventing.prototype.fireDeleted = function(filter,deletecount){
    if(this.deleted && deletecount){
      this.deleted.fire(filter,deletecount);
    }
  };


  //JOBS
  function NullOp (defer) {
    JobBase.call(this, defer);
  }
  lib.inherit(NullOp, JobBase);
  NullOp.prototype.go = function () {
    var ok = this.okToGo();
    if (!ok.ok) {
      return ok.val;
    }
    this.resolve(true);
    return ok.val;
  };

  function StorageJob (storage, defer) {
    JobBase.call(this, defer);
    this.storage = storage;
  }
  lib.inherit(StorageJob, JobBase);
  StorageJob.prototype.destroy = function () {
    this.storage = null;
    JobBase.prototype.destroy.call(this);
  };

  function InitBeginner (storage, txnid, defer) {
    StorageJob.call(this, storage, defer);
    this.txnid = txnid;
  }
  lib.inherit(InitBeginner, StorageJob);
  InitBeginner.prototype.destroy = function () {
    this.txnid = null;
    StorageJob.prototype.destroy.call(this);
  };
  InitBeginner.prototype.go = function () {
    var txnid;
    if (!this.storage) {
      this.resolve(null);
      return;
    }
    if (!this.storage.__record) {
      this.resolve(null);
      return;
    }
    txnid = this.txnid;
    if (!txnid) {
      this.resolve(null);
      return;
    }
    this.txnid = null;
    this.storage.deleteOnChannel(mylib.filterFactory.createFromDescriptor(null), 'ib').then(
      this.storage.onAllDeletedForBegin.bind(this.storage, txnid, this),
      this.reject.bind(this)
    );
  };

  function InitEnder (storage, txnid, defer) {
    StorageJob.call(this, storage, defer);
    this.txnid = txnid;
  }
  lib.inherit(InitEnder, StorageJob);
  InitEnder.prototype.destroy = function () {
    this.txnid = null;
    StorageJob.prototype.destroy.call(this);
  };
  InitEnder.prototype.go = function () {
    var txnid;
    if (!this.storage) {
      this.resolve(null);
      return;
    }
    if (!this.storage.__record) {
      this.resolve(null);
      return;
    }
    txnid = this.txnid;
    if (!txnid) {
      this.resolve(null);
      return;
    }
    this.txnid = null;
    if(this.storage.events){
      this.storage.events.endInit(txnid,this.storage);
    }
    this.resolve(true);
  };

  function Creator (storage, defer) {
    StorageJob.call(this, storage, defer);
    this.chunks = [];
    this.hashes = [];
  }
  lib.inherit(Creator, StorageJob);
  Creator.prototype.destroy = function () {
    this.datahash = null;
    StorageJob.prototype.destroy.call(this);
  };
  Creator.prototype.go = function () {
    this.subgo();
  };
  Creator.prototype.subgo = function () {
    var chunk;
    if (this.chunks && this.chunks.length) {
      chunk = this.chunks.shift();
    } else {
      chunk = this.hashes;
      this.hashes = [];
    }
    if (chunk && chunk.length) {
      return q.allSettled(chunk.map(this.createOne.bind(this))).then(this.subgo.bind(this));
    }
    this.resolve(true);
  };
  Creator.prototype.createOne = function (dndatahash) {
    var d, datahash, ret;
    d = dndatahash[0];
    datahash = dndatahash[1];
    if (!this.storage) {
      this.resolve(null);
      return;
    }
    if (!this.storage.__record) {
      this.resolve(null);
      return;
    }
    if (!datahash) {
      this.resolve(null);
      return;
    }
    ret = d.promise;
    if (dndatahash && !!dndatahash.instancename) {
      console.log('Creator createOne?', dndatahash);
    }
    if(this.storage.events){
      d.promise.then(this.storage.events.fireNewRecord.bind(this.storage.events));
    }
    this.storage.doCreate(this.storage.__record.filterObject(datahash),d);
    return ret;
  };
  Creator.prototype.add = function (datahash) {
    var d = q.defer(), ret = d.promise;
    this.hashes.push([d, datahash]);
    if (this.hashes.length>999) {
      this.chunks.push(this.hashes);
      this.hashes = [];
    }
    return ret;
  };

  function Updater (storage, filter, datahash, options, defer) {
    StorageJob.call(this, storage, defer);
    this.filter = filter;
    this.datahash = datahash;
    this.options = options;
  }
  lib.inherit(Updater, StorageJob);
  Updater.prototype.destroy = function () {
    this.options = null;
    this.datahash = null;
    this.filter = null;
    StorageJob.prototype.destroy.call(this);
  };
  Updater.prototype.go = function () {
    var filter, datahash, options;
    if (!this.storage) {
      this.resolve(null);
      return;
    }
    if (!this.storage.__record) {
      this.resolve(null);
      return;
    }
    filter = this.filter;
    datahash = this.datahash;
    options = this.options;
    if (!(filter || datahash || options)) {
      this.resolve(null);
      return;
    }
    this.filter = null;
    this.datahash = null;
    this.options = null;
    if(this.storage.events){
      this.defer.promise.then(this.storage.events.fireUpdated.bind(this.storage.events,filter,datahash));
    }
    this.storage.doUpdate(filter,datahash,options,this);
  };
  Updater.prototype.notify = function (ntf) {
    if(this.storage && this.storage.events){
      this.storage.events.recordUpdated.fire(ntf[0], ntf[1]);
    }
    StorageJob.prototype.notify.call(this, ntf);
  };

  function Deleter (storage, filter, defer) {
    StorageJob.call(this, storage, defer);
    this.filter = filter;
  }
  lib.inherit(Deleter, StorageJob);
  Deleter.prototype.destroy = function () {
    this.filter = null;
    StorageJob.prototype.destroy.call(this);
  };
  Deleter.prototype.go = function () {
    if (!this.storage) {
      this.resolve(null);
      return;
    }
    if (!this.storage.__record) {
      this.resolve(null);
      return;
    }
    if(this.storage.events){
      this.defer.promise.then(this.storage.events.fireDeleted.bind(this.storage.events,this.filter));
    }
    this.storage.doDelete(this.filter, this);
  };


  var __id = 0;
  function StorageBase(storagedescriptor, visiblefields){
    //this.__id = process.pid+':'+(++__id);
    if(!(storagedescriptor && storagedescriptor.record)){
      console.trace();
      console.log("No storagedescriptor.record!");
    }
    this.__record = new Record(storagedescriptor.record, visiblefields);
    this.jobs = new qlib.JobCollection();
    this.events = storagedescriptor.events ? new StorageBaseEventing : null;
  };
  StorageBase.prototype.destroy = function(){
    if(this.events){
      this.events.destroy();
    }
    this.events = null;
    if(this.jobs) {
      this.jobs.destroy();
    }
    this.jobs = null;
    if (this.__record) {
      this.__record.destroy();
    }
    this.__record = null;
  };
  StorageBase.prototype.nullOp = function () {
    return this.jobs.run('op', new NullOp());
  };
  StorageBase.prototype.create = function(datahash){
    var lastpendingjob, job, ret;
    if (!this.jobs) {
      return q(null);
    }
    lastpendingjob = this.jobs.lastPendingJobFor('op');
    if (lastpendingjob && lastpendingjob instanceof Creator) {
      return lastpendingjob.add(datahash);
    }
    job = new Creator(this);
    ret = job.add(datahash);
    this.jobs.run('op', job);
    return ret;
  };
  StorageBase.prototype.read = function(query){
    var d = q.defer();
    if(query.isEmpty()){
      d.resolve(null);
    }else{
      lib.runNext(this.doRead.bind(this,query,d));
    }
    return d.promise;
  };
  StorageBase.prototype.update = function(filter,datahash,options){
    if (!this.jobs) {
      return q(null);
    }
    return this.jobs.run('op', new Updater(this, filter, datahash, options));
  };
  StorageBase.prototype.beginInit = function(txnid){
    if (!this.jobs) {
      return q(null);
    }
    return this.jobs.run('op', new InitBeginner(this, txnid));
  };
  StorageBase.prototype.onAllDeletedForBegin = function (txnid, defer) {
    if (this.data) {
      if (this.data.length) {
        throw new lib.Error('DATA_NOT_EMPTY');
      }
    }
    if(this.events){
      this.events.beginInit(txnid);
    }
    defer.resolve(true);
  };
  StorageBase.prototype.endInit = function(txnid){
    if (!this.jobs) {
      return q(null);
    }
    return this.jobs.run('op', new InitEnder(this, txnid));//.then(null, console.error.bind(console, 'wut'));
  };
  StorageBase.prototype.delete = function(filter){
    return this.deleteOnChannel(filter, 'op');
  };
  StorageBase.prototype.deleteOnChannel = function (filter, channelname){
    if (!this.jobs) {
      return q(null);
    }
    return this.jobs.run(channelname, new Deleter(this, filter));
  };

  StorageBase.prototype.aggregate = function (aggregation_descriptor) {
    var d = q.defer();
    qlib.promise2defer (this.doAggregate(aggregation_descriptor), d);
    return d.promise;
  };
  mylib.StorageBase = StorageBase;
}

module.exports = createStorageBase;

},{}],22:[function(require,module,exports){
function createCloneStorage(execlib, mylib){
  'use strict';
  var StorageBase = mylib.StorageBase;
  function CloneStorage(storagedescriptor){
    StorageBase.call(this,storagedescriptor);
    this.original = options.original;
    this.record = this.original.record;
    if(!(this.original instanceof StorageBase)){
      throw new Error("CloneStorage cannot clone a non-StorageBase instance");
    }
  }
  execlib.lib.inherit(CloneStorage,StorageBase);
  CloneStorage.prototype.destroy = function(){
    this.record = null;
    this.original = null;
    StorageBase.prototype.destroy.call(this);
  };
  CloneStorage.prototype.doCreate = function(datahash,defer){
    this.original.doCreate(datahash,defer);
  };
  CloneStorage.prototype.doRead = function(query,defer){
    console.log('CloneStorage',this.original,query);
    this.original.doRead(datahash,defer);
  };
  mylib.CloneStorage = CloneStorage;
}

module.exports = createCloneStorage;

},{}],23:[function(require,module,exports){
function createStorage (execlib, mylib) {
  'use strict';

  require('./basecreator')(execlib, mylib);
  require('./nullcreator')(execlib, mylib);
  require('./clonecreator')(execlib, mylib);
  require('./memorybasecreator')(execlib, mylib);
  require('./asyncstoragemixincreator')(execlib, mylib);
  //require('./asyncmemorystoragebasecreator')(execlib, mylib);
  require('./memorycreator')(execlib, mylib);
  require('./memorylistcreator')(execlib, mylib);
  require('./associativemixincreator')(execlib, mylib);
  require('./associativebasecreator')(execlib, mylib);
  require('./memorymapcreator')(execlib, mylib);
  mylib.storageRegistry.register('memory', mylib.MemoryStorage);
  mylib.storageRegistry.register('memorylist', mylib.MemoryListStorage);
}

module.exports = createStorage;

},{"./associativebasecreator":18,"./associativemixincreator":19,"./asyncstoragemixincreator":20,"./basecreator":21,"./clonecreator":22,"./memorybasecreator":24,"./memorycreator":25,"./memorylistcreator":26,"./memorymapcreator":27,"./nullcreator":28}],24:[function(require,module,exports){
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

},{}],25:[function(require,module,exports){
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
    for(var i=start; i<end; i++){
      cb(query,defer,this.__record.filterHash(this.data[i]));
    }
    return q(true);
  };
  MemoryStorage.prototype.removeDataAtIndex = function (index) {
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

},{}],26:[function(require,module,exports){
function createMemoryStorage(execlib, mylib){
  'use strict';
  var lib = execlib.lib,
    q = lib.q,
    MemoryStorageBase = mylib.MemoryStorageBase;

  function MemoryListStorage (storagedescriptor, data) {
    MemoryStorageBase.call(this, storagedescriptor, data);
  }
  lib.inherit(MemoryListStorage, MemoryStorageBase);
  MemoryListStorage.prototype._createData = function () {
    return new lib.SortedList();
  };
  MemoryListStorage.prototype._destroyDataWithElements = function () {
    lib.containerDestroyAll(this.data);
    this.data.destroy();
  };
  MemoryListStorage.prototype._traverseData = function (cb) {
    this.data.traverse(cb);
  };
  function rangeTraverser (start, endexclusive, cb, cntobj, item) {
    if (cntobj.cnt >= start && cntobj.cnt < endexclusive) {
      cb(item);
    }
    cntobj.cnt++;
  };
  MemoryListStorage.prototype._traverseDataRange = function (cb, start, endexclusive) {
    var cntobj = {cnt:0};
    this.data.traverse(rangeTraverser.bind(null, start, endexclusive, cb, cntobj));
  };
  MemoryListStorage.prototype.removeDataAtIndex = function (index) {
    this.data.removeOne(index);
  };
  MemoryListStorage.prototype._traverseConditionally = function (cb) {
    return this.data.traverseConditionally(cb);
  };

  mylib.MemoryListStorage = MemoryListStorage;
}

module.exports = createMemoryStorage;


},{}],27:[function(require,module,exports){
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

},{}],28:[function(require,module,exports){
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

},{}],29:[function(require,module,exports){
function createTasks (execlib, mylib) {
  'use strict';
  var FromDataSinkBaseTask = require('./tasks/fromdatasinkbasecreator')(execlib);
  return [{
    name: 'materializeQuery',
    klass: require('./tasks/materializeQuery')(execlib, mylib)
  },{
    name: 'forwardData',
    klass: require('./tasks/forwardData')(execlib, mylib)
  },{
    name: 'readFromDataSink',
    klass: require('./tasks/readFromDataSink')(execlib, FromDataSinkBaseTask)
  },{
    name: 'streamFromDataSink',
    klass: require('./tasks/streamFromDataSink')(execlib, FromDataSinkBaseTask)
  },{
    name: 'joinFromDataSinks',
    klass: require('./tasks/joinFromDataSinks')(execlib)
  },
  {
    name : 'aggregate',
    klass: require('./tasks/materializeAggregation')(execlib, mylib)
  }];
}

module.exports = createTasks;

},{"./tasks/forwardData":30,"./tasks/fromdatasinkbasecreator":31,"./tasks/joinFromDataSinks":32,"./tasks/materializeAggregation":33,"./tasks/materializeQuery":34,"./tasks/readFromDataSink":35,"./tasks/streamFromDataSink":36}],30:[function(require,module,exports){
function createFollowDataTask(execlib, mylib){
  'use strict';
  var lib = execlib.lib,
    q = lib.q,
    qlib = lib.qlib,
    execSuite = execlib.execSuite,
    taskRegistry = execSuite.taskRegistry,
    MultiDestroyableTask = execSuite.MultiDestroyableTask,
    DataDecoder = mylib.DataDecoder;

  function ChildSinkStorage(sink){
    this.sink = sink;
  }
  ChildSinkStorage.prototype.beginInit = function () {
    return this.sink.call('delete', null);
  };
  //ChildSinkStorage.prototype.endInit = lib.dummyFunc;
  ChildSinkStorage.prototype.endInit = function () {return q(true);};
  ChildSinkStorage.prototype.create = function(datahash){
    return this.sink.call('create',datahash);
  };
  ChildSinkStorage.prototype.update = function(filter,datahash,options){
    return this.sink.call('update',filter.__descriptor,datahash,options);
  };
  ChildSinkStorage.prototype.delete = function(filter){
    return this.sink.call('delete',filter.__descriptor);
  };

  function FollowDataTask(prophash){
    MultiDestroyableTask.call(this,prophash,['sink','childsink']);
    this.sink = prophash.sink;
    this.storage = new ChildSinkStorage(prophash.childsink);
    this.decoder = null;
  }
  lib.inherit(FollowDataTask,MultiDestroyableTask);
  FollowDataTask.prototype.__cleanUp = function(){
    /*
    if(this.sink.destroyed){ //it's still alive
      this.sink.consumeChannel('d',lib.dummyFunc);
    }
    */
    if (this.sink && this.decoder && this.decoder.queryID) {
      this.sink.sessionCall('closeQuery', this.decoder.queryID);
    }
    if (this.decoder) {
      this.decoder.destroy();
    }
    this.decoder = null;
    if (this.storage) {
      this.storage.destroy();
    }
    this.storage = null;
    this.sink = null;
    MultiDestroyableTask.prototype.__cleanUp.call(this);
  };
  FollowDataTask.prototype.go = function(){
    if (this.decoder) {
      return;
    }
    this.decoder = new DataDecoder(this.storage); 
    this.sink.sessionCall('query', {continuous:true}).then(
      this.destroy.bind(this),
      this.destroy.bind(this),
      this.decoder.onStream.bind(this.decoder)
    );
    //this.sink.consumeChannel('d',new DataDecoder(this.storage));
  };
  FollowDataTask.prototype.compulsoryConstructionProperties = ['sink','childsink'];

  return FollowDataTask;
}

module.exports = createFollowDataTask;

},{}],31:[function(require,module,exports){
function createFromDataSinkBase (execlib) {
  'use strict';

  var lib = execlib.lib,
    q = lib.q,
    execSuite = execlib.execSuite,
    SinkTask = execSuite.SinkTask;

  function FromDataSinkBase (prophash) {
    SinkTask.call(this, prophash);
    this.sink = prophash.sink;
    this.filter = prophash.filter;
    this.visiblefields = prophash.visiblefields;
    this.limit = prophash.limit;
    this.offset = prophash.offset;
    this.readID = null;
  };
  lib.inherit(FromDataSinkBase, SinkTask);
  FromDataSinkBase.prototype.__cleanUp = function () {
    this.readID = null;
    this.offset = null;
    this.limit = null;
    this.visiblefields = null;
    this.filter = null;
    this.sink = null;
    SinkTask.prototype.__cleanUp.call(this);
  };
  FromDataSinkBase.prototype.go = function () {
    try {
      this.checkBeforeGo();
    }
    catch (e) {
      this.onFail(e);
      return;
    }
    this.sink.call('read', {
      filter: this.filter,
      visiblefields: this.visiblefields,
      limit: this.limit,
      offset: this.offset
    }).then(
      this.onRead.bind(this),
      this.onFail.bind(this),
      this.onEvent.bind(this)
    );
  };
  FromDataSinkBase.prototype.onEvent = function (item) {
    //console.log(item);
    if (!this.data) {
      return;
    }
    if (lib.isArray(item)) {
      switch(item[0]) {
        case 'rb':
          this.readID = item[1];
          break;
        case 'r1':
          if (!this.checkReadID(item[1])) {
            return;
          }
          this.handleRecord(item[2]);
          break;
        case 're':
          if (!this.checkReadID(item[1])) {
            return;
          }
          this.readID = 'finished';
          break;
        default:
          break;
      }
    }
  };
  FromDataSinkBase.prototype.checkReadID = function (rid) {
    if (rid !== this.readID) {
      this.onFail(new lib.Error('DATA_READ_INCONSISTENCY', 'Got '+rid+', expected '+this.readID));
      return false;
    }
    return true;
  };
  FromDataSinkBase.prototype.onRead = function () {
    if ('finished' !== this.readID) {
      this.onFail(new lib.Error('DATA_READ_UNFINISHED', 'DataSink did not report read end'));
      return;
    }
    this.handleSuccess();
    this.destroy();
  };
  FromDataSinkBase.prototype.onFail = function (reason) {
    this.handleError(reason);
    this.destroy();
  };

  return FromDataSinkBase;
}
module.exports = createFromDataSinkBase;

},{}],32:[function(require,module,exports){
function createJoinFromDataSinksTask(execlib) {
  'use strict';
  var lib = execlib.lib,
    q = lib.q,
    execSuite = execlib.execSuite,
    Task = execSuite.Task,
    taskRegistry = execSuite.taskRegistry;

  function ArryizedColumn(prophash) {

  }
  ArryizedColumn.prototype.destroy = function () {
  };
  ArryizedColumn.prototype.process = function (item, name, data) {
    var a = item[name], target = data[name];
    if (!a) {
      a = [];
      item[name] = a;
    }
    if (lib.isArray(target)) {
      a.push.apply(a, target);
    } else {
      a.push(target);
    }
  };
  ArryizedColumn.prototype.initValue = function () {
    return [];
  };

  function AggregatedData (desc) {
    this.pkColumns = [];
    this.processors = new lib.Map();
    desc.forEach(this.doDescItem.bind(this));
  }
  AggregatedData.prototype.destroy = function () {
  };
  AggregatedData.prototype.doDescItem = function (descitem) {
    if (!descitem.name) {
      throw new lib.Error('NO_DESCITEM_NAME',descitem);
    }
    switch(descitem.op) {
      case 'arrayize':
        this.processors.add(descitem.name, new ArryizedColumn(descitem.propertyhash));
        break;
      default:
        this.pkColumns.push(descitem.name);
    }
  };
  AggregatedData.prototype.aggregate = function (data) {
    var ret = [];
    data.forEach(this.add.bind(this, ret));
    return ret;
  };
  AggregatedData.prototype.add = function (output, datahash) {
    //console.log('finding out the item for', datahash);
    try {
    var item = this.find(datahash, output) || this.newObjTo(datahash, output);
    } catch (e) {
      console.error(e.stack);
      console.error(e);
    }
    //console.log('working on aggro item', item, this.processors.count, 'processors');
    this.processors.traverse(function (processor, name) {
      processor.process(item, name, datahash);
    });
  };
  AggregatedData.prototype.newObj = function (datahash) {
    var ret = {};
    this.pkColumns.forEach(function (pkc) {
      ret[pkc] = datahash[pkc];
    });
    this.processors.traverse(function (proc, name) {
      ret[name] = proc.initValue();
    });
    return ret;
  };
  AggregatedData.prototype.newObjTo = function (datahash, output) {
    var ret = this.newObj(datahash);
    output.push(ret);
    return ret;
  };
  AggregatedData.prototype.find = function (datahash, output) {
    var foundobj = {found: null};
    output.some(this.conformsToPK.bind(this, foundobj, datahash));
    return foundobj.found;
  };
  AggregatedData.prototype.conformsToPK = function (foundobj, datahash, item) {
    if (this.pkColumns.length < 1) {
      foundobj.found = item;
      return true;
    }
    return this.pkColumns.every(function(column) {
      if (datahash[column] === item[column]) {
        foundobj.found = item;
        return true;
      }
    });
  };

  function DataJobBase () {
    this.children = [];
    this.state = new lib.ListenableMap();
  }
  DataJobBase.prototype.destroy = function () {
    if (this.state) {
      this.state.destroy();
    }
    this.state = null;
    if (this.children) {
      lib.arryDestroyAll(this.children);
    }
    this.children = null;
  };

  function RootDataJob () {
    DataJobBase.call(this);
    this.state.add('output', []);
  }
  lib.inherit(RootDataJob, DataJobBase);

  function DataJob(parnt, prophash) {
    DataJobBase.call(this);
    this.aggregator = null;
    if (prophash.output) {
      this.aggregator = new AggregatedData(prophash.output);
    }
    this.parnt = parnt;
    parnt.children.push(this);
  }
  lib.inherit(DataJob, DataJobBase);
  DataJob.prototype.destroy = function () {
    this.parnt = null;
    if (this.aggregator) {
      this.aggregator.destroy();
    }
    this.aggregator = null;
    RootDataJob.prototype.destroy.call(this);
  };

  function DataSinkSubJob (parnt, filter, sink, defer) {
    this.parnt = parnt;
    this.sink = sink;
    this.data = [];
    this.output = [];
    this.defer = defer;
    var handler = this.produceOutput.bind(this);
    taskRegistry.run('materializeQuery', {
      sink: sink,
      filter: filter,
      continuous: true,
      data: this.data,
      onInitiated: handler,
      onNewRecord: handler,
      onUpdate: handler,
      onDelete: handler
    });
  }
  DataSinkSubJob.prototype.destroy = function () {
    this.defer = null;
    this.output = null;
    this.data = null;
    if (this.sink.destroyed) {
      lib.destroyASAP(this.sink);
    }
    this.sink = null;
    this.parnt = null;
  };
  DataSinkSubJob.prototype.produceOutput = function () {
    var d, assembleresult;
    if (!this.parnt) {
      return;
    }
    d = this.defer;
    this.defer = null;
    if (this.parnt.aggregator) {
      this.output = this.parnt.aggregator.aggregate(this.data);
    } else {
      this.output = this.data;
    }
    assembleresult = this.parnt.assembleOutput();
    if (d) {
      d.resolve(true);
    } else {
      if (assembleresult) {
        this.parnt.dataProduced();
      }
    }
  };

  function DataSinkDataJob (parnt, prophash) {
    DataJob.call(this, parnt, prophash);
    this.filter = prophash.filter;
    this.subsinks = [];
    if (!this.filter) {
      throw new lib.Error('FILTER_NEEDED', 'JobDescriptor misses the "filter" field');
    }
  }
  lib.inherit(DataSinkDataJob, DataJob);
  DataSinkDataJob.prototype.destroy = function () {
    if (this.subsinks) {
      lib.arryDestroyAll(this.subsinks);
    }
    this.subsinks = null;
    this.filter = null;
    DataJob.prototype.destroy.call(this);
  };
  DataSinkDataJob.prototype.dataProduced = function () {
    if (this.state.get('output')) {
      this.children.forEach(function(c){
        c.trigger();
      });
    }
  };
  DataSinkDataJob.prototype.onSink = function (sink) {
    //console.log('Job with filter', this.filter, 'onSink', sink ? sink.modulename : 'no sink');
    if (!this.state) {
      return;
    }
    this.state.replace('sink', sink);
    if (!sink) {
      return;
    }
    this.trigger();
  };
  DataSinkDataJob.prototype.onSubSink = function (filter, defer, inputrow, subsink) {
    if (!subsink) {
      return;
    }
    this.subsinks.push(new DataSinkSubJob(this, filter, subsink, defer));
  };
  DataSinkDataJob.prototype.assembleOutput = function () {
    if(this.subsinks.some(function(ss) {return ss.defer;})){
      return false;
    }
    var output = [];
    this.subsinks.forEach(function(ss) {
      Array.prototype.push.apply(output, ss.output);
    });
    this.state.replace('output', output);
    return true;
  };
  DataSinkDataJob.prototype.onNoSink = function (defer, reason) {
    defer.reject(reason);
    this.destroy();
  };
  DataSinkDataJob.prototype.trigger = function () {
    lib.arryDestroyAll(this.subsinks);
    this.subsinks = [];
    if (lib.isFunction(this.filter)) {
      var fr = this.filter();
      if (lib.isFunction(fr.done)) {
        fr.done(this.onFilter.bind(this));
      } else {
        this.onFilter(fr);
      }
    } else {
      this.onFilter(this.filter);
    }
  };
  DataSinkDataJob.prototype.onFilter = function (filter) {
    //console.log('filter', this.filter, 'resulted in filter', filter);
    if (!filter) {
      //console.log('but no filter');
      return;
    }
    if (!this.parnt) {
      //console.log('but no parent');
      return;
    }
    if (!this.parnt.state) {
      //console.log('but no parent state');
      return;
    }
    var input = this.parnt.state.get('output');
    if (!input) {
      //console.log('but no input');
      return;
    }
    //console.log('filter can proceeed');
    var f = this.isFilterInputDependent(filter);
    if (f) {
      q.allSettled(input.map(this.applyDataDependentFilter.bind(this, f))).done(
        this.dataProduced.bind(this),
        console.error.bind(console, 'applyDataDependentFilter error')
      );
    } else { 
      this.applyFilter(filter).done(
        this.dataProduced.bind(this),
        console.error.bind(console, 'applyFilter error')
      );
    }
  };
  DataSinkDataJob.prototype.applyFilter = function (filter, inputrow) {
    var d = q.defer();
    var sink = this.state.get('sink');
    if (!(sink && sink.destroyed && sink.recordDescriptor)) {
      d.resolve(null);
      return d.promise;
    }
    //console.log(filter, 'subconnecting to', sink.modulename);
    sink.subConnect('.', {
      name: 'user',
      role: 'user'
    }).done(
      this.onSubSink.bind(this, filter, d, inputrow),
      this.onNoSink.bind(this, d)
    );
    return d.promise;
  };
  DataSinkDataJob.prototype.isFilterInputDependent = function (filter) {
    if (filter.value && 
      filter.value.substring(0,2) === '{{' && 
      filter.value.substring(filter.value.length-2) === '}}') {
      var ret = lib.extend({}, filter);
      ret.value = filter.value.substring(2,filter.value.length-2);
      return ret;
    }
    return null;
  };
  DataSinkDataJob.prototype.applyDataDependentFilter = function (filter, datahash) {
    var ret = lib.extend({}, filter);
    ret.value = datahash[ret.value];
    //console.log(filter, '=>', ret);
    return this.applyFilter(ret, datahash);
  };

  function LocalAcquirerDataJob(parnt, prophash) {
    DataSinkDataJob.call(this, parnt, prophash);
    this.service = prophash.service;
    this.serviceDestroyedListener = this.service.destroyed.attach(this.destroy.bind(this));
    //console.log('LocalAcquirerDataJob listening for', prophash.sinkname);
    //this.sinkListener = this.service.listenForSubService(prophash.sinkname, this.onSink.bind(this), true);
    this.sinkListener = this.service.subservices.listenFor(prophash.sinkname, this.onSink.bind(this), true);
  }
  lib.inherit(LocalAcquirerDataJob, DataSinkDataJob);
  LocalAcquirerDataJob.prototype.destroy = function () {
    if (this.serviceDestroyedListener) {
      lib.destroyASAP(this.serviceDestroyedListener);
      this.serviceDestroyedListener = null;
    }
    this.serviceDestroyedListener = null;
    if (this.sinkListener) {
      lib.destroyASAP(this.sinkListener);
      this.sinkListener = null;
    }
    this.sinkListener = null;
    this.service = null;
    DataSinkDataJob.prototype.destroy.call(this);
  };

  function GlobalAcquirerDataJob(parnt, prophash) {
    DataSinkDataJob.call(this, parnt, prophash);
    //console.log('GlobalAcquirerDataJob listening for', prophash.sinkname);
    this.sinkListener = taskRegistry.run('findSink', {
      sinkname: prophash.sinkname, 
      identity: prophash.identity || {},
      onSink: this.onSink.bind(this)
    });
  }
  lib.inherit(GlobalAcquirerDataJob, DataSinkDataJob);
  GlobalAcquirerDataJob.prototype.destroy = function () {
    if (this.sinkListener) {
      lib.runNext(this.sinkListener.destroy.bind(this.sinkListener));
      this.sinkListener = null;
    }
    this.sinkListener = null;
    this.service = null;
    DataSinkDataJob.prototype.destroy.call(this);
  };

  function TargetSinkDataJob (parnt, jobdesc) {
    DataJob.call(this, parnt, jobdesc);
    this.sink = jobdesc.sink;
  }
  lib.inherit(TargetSinkDataJob, DataJob);
  TargetSinkDataJob.prototype.destroy = function () {
    this.sink = null;
    DataJob.prototype.destroy.call(this);
  };
  TargetSinkDataJob.prototype.trigger = function () {
    var input = this.parnt.state.get('output'),
      sink = this.sink;
    sink.call('delete', {}).then(
      input.forEach(sink.call.bind(sink, 'create'))
    );
  };

  function FuncDataJob (parnt, func) {
    DataJob.call(this, parnt, {});
    this.func = func;
  }
  lib.inherit(FuncDataJob, DataJob);
  FuncDataJob.prototype.destroy = function () {
    this.func = null;
    DataJob.prototype.destroy.call(this);
  };
  FuncDataJob.prototype.trigger = function () {
    if (!this.func) {
      return;
    }
    this.func(this.parnt.state.get('output'));
  };

  function JoinFromDataSinks(prophash) {
    Task.call(this, prophash);
    this.jobs = prophash.jobs;
    this.job = null;
  }
  lib.inherit(JoinFromDataSinks, Task);
  JoinFromDataSinks.prototype.destroy = function () {
    this.jobs = null;
    if (this.job) {
      this.job.destroy();
    }
    this.job = null;
  };
  function createJob (parentjob, jobdesc) {
    var job;
    if (lib.isArray(jobdesc)) {
      job = this.createJob(parentjob, jobdesc[0]);
    } else if ('function' === typeof jobdesc) {
      job = new FuncDataJob(parentjob, jobdesc);
    } else if (jobdesc.type === 'targetsink') {
      job = new TargetSinkDataJob(parentjob, jobdesc);
    } else if (jobdesc.type === 'sub') {
      job = new LocalAcquirerDataJob(parentjob, jobdesc);
    } else if (jobdesc.type === 'global') {
      job = new GlobalAcquirerDataJob(parentjob, jobdesc);
    }
    if (lib.isArray(jobdesc.jobs)) {
      jobdesc.jobs.forEach(createJob.bind(null, job));
    }
  };
  JoinFromDataSinks.prototype.go = function () {
    if (this.job) {
      return;
    }
    this.job = new RootDataJob();
    this.jobs.forEach(createJob.bind(null, this.job));
    this.jobs = null;
  };
  JoinFromDataSinks.prototype.compulsoryConstructionProperties = ['jobs'];

  return JoinFromDataSinks;
}

module.exports = createJoinFromDataSinksTask;

},{}],33:[function(require,module,exports){
function createMaterializeAggregationTask (execlib, mylib) {
  'use strict';
  var lib = execlib.lib,
    q = lib.q,
    qlib = lib.qlib,
    execSuite = execlib.execSuite,
    SinkTask = execSuite.SinkTask,
    DataDecoder = mylib.DataDecoder,
    MemoryStorage = mylib.MemoryStorage;


  function MaterializeAggregationTask (prophash) {
    if (!lib.isFunction (prophash.onRecord)) {
      throw new lib.Error('NOT_A_FUNCTION' ,'onRecord is not a function in MaterializeAggregationTask');
    }

    if (prophash.interval && (!lib.isNumber(prophash.interval) || prophash.interval < 0)) {
      throw new lib.Error ('INVALID_INTERVAL', 'Interval '+prophash.interval+' not allowed');
    }

    SinkTask.call(this, prophash);
    this.sink = prophash.sink;
    this._to = null;
    this.query = prophash.query;
    this.onRecord = prophash.onRecord;
    this.onDone = prophash.onDone;
    this.onError = prophash.onError;
    this.interval = prophash.interval;
  }
  lib.inherit (MaterializeAggregationTask, SinkTask);
  MaterializeAggregationTask.prototype.__cleanUp = function () {
    if (this._to) {
      lib.clearTimeout (this._to);
    }

    this.cb = null;
    this.error_cb = null;
    this._to = null;
    this.continuous = null;
    this.sink = null;
    this.query = null;
    this.onRecord = null;
    this.onError = null;
    this.onDone = null;
    this.interval = null;
    SinkTask.prototype.__cleanUp.call(this);
  };

  MaterializeAggregationTask.prototype.go = function () {
    this._fetch();
  };

  MaterializeAggregationTask.prototype._fetch = function () {
    this.sink.call('aggregate', this.query).done(this._onFetchDone.bind(this), this._onFetchError.bind(this), this._onRecord.bind(this));
  };

  MaterializeAggregationTask.prototype._onFetchDone = function () {
    this._to = null;
    if (lib.isFunction (this.onDone)) {
      this.onDone(true);
    }

    if (!this.interval) {
      lib.runNext (this.destroy.bind(this));
      return;
    }
    this._to = lib.runNext (this._fetch.bind(this), this.interval);
  };

  MaterializeAggregationTask.prototype._onFetchError = function (error) {
    if (lib.isFunction(this.onError)) {
      this.onError (error);
    }
    lib.runNext (this.destroy.bind(this));
  };

  MaterializeAggregationTask.prototype._onRecord = function (record) {
    this.onRecord(record);
  };

  MaterializeAggregationTask.prototype.compulsoryConstructionProperties = ['query', 'onRecord', 'onError' ,'sink'];
  return MaterializeAggregationTask;
}


module.exports = createMaterializeAggregationTask;

},{}],34:[function(require,module,exports){
function createMaterializeQueryTask(execlib, mylib){
  'use strict';
  var lib = execlib.lib,
    q = lib.q,
    qlib = lib.qlib,
    execSuite = execlib.execSuite,
    SinkTask = execSuite.SinkTask,
    DataDecoder = mylib.DataDecoder,
    MemoryStorage = mylib.MemoryStorage;

  function MaterializeQueryTask(prophash){
    SinkTask.call(this,prophash);
    this.storage = null;
    this.decoder = null;
    this.sink = prophash.sink;
    this.filter = prophash.filter;
    this.singleshot = prophash.singleshot;
    this.continuous = prophash.continuous;
    this.visiblefields = prophash.visiblefields;
    this.limit = prophash.limit;
    this.offset = prophash.offset;
    this.data = prophash.data;
    this.onInitiated = prophash.onInitiated;
    this.onRecordCreation = prophash.onRecordCreation;
    this.onNewRecord = prophash.onNewRecord;
    this.onUpdate = prophash.onUpdate;
    this.onRecordUpdate = prophash.onRecordUpdate;
    this.onDelete = prophash.onDelete;
    this.onRecordDeletion = prophash.onRecordDeletion;
    this.initiatedListener = null;
    this.createdListener = null;
    this.newRecordListener = null;
    this.updatedListener = null;
    this.recordUpdatedListener = null;
    this.deletedListener = null;
    this.recordDeletedListener = null;
  }
  lib.inherit(MaterializeQueryTask,SinkTask);
  MaterializeQueryTask.prototype.__cleanUp = function(){
    if (this.sink && this.decoder && this.decoder.queryID) {
      this.sink.sessionCall('closeQuery', this.decoder.queryID);
    }
    if(this.recordDeletedListener){
      this.recordDeletedListener.destroy();
    }
    this.recordDeletedListener = null;
    if(this.deletedListener){
      this.deletedListener.destroy();
    }
    this.deletedListener = null;
    if(this.recordUpdatedListener){
      this.recordUpdatedListener.destroy();
    }
    this.recordUpdatedListener = null;
    if(this.updatedListener){
      this.updatedListener.destroy();
    }
    this.updatedListener = null;
    if(this.newRecordListener){
      this.newRecordListener.destroy();
    }
    this.newRecordListener = null;
    if(this.createdListener){
      this.createdListener.destroy();
    }
    this.createdListener = null;
    if(this.initiatedListener){
      this.initiatedListener.destroy();
    }
    this.initiatedListener = null;
    this.onRecordDeletion = null;
    this.onDelete = null;
    this.onRecordUpdate = null;
    this.onUpdate = null;
    this.onNewRecord = null;
    this.onRecordCreation = null;
    this.onInitiated = null;
    this.offset = null;
    this.limit = null;
    this.data = null;
    this.visiblefields = null;
    this.continuous = null;
    this.singleshot = null;
    this.filter = null;
    this.sink = null;
    if(this.storage){
      this.storage.destroy();
    }
    if (this.decoder) {
      this.decoder.destroy();
    }
    this.decoder = null;
    this.storage = null;
    SinkTask.prototype.__cleanUp.call(this);
  };
  MaterializeQueryTask.prototype.go = function(){
    this.storage = new MemoryStorage({
      events: this.onInitiated || this.onRecordCreation || this.onNewRecord || this.onUpdate || this.onRecordUpdate || this.onDelete || this.onRecordDeletion,
      record: this.sink.recordDescriptor
    },this.visiblefields,this.data);
    this.decoder = new DataDecoder(this.storage);
    if(this.onInitiated){
      this.initiatedListener = this.storage.events.initiated.attach(this.onInitiated);
    }
    if(this.onRecordCreation){
      this.createdListener = this.storage.events.created.attach(this.onRecordCreation);
    };
    if(this.onNewRecord){
      this.newRecordListener = this.storage.events.newRecord.attach(this.onNewRecord);
    }
    if(this.onUpdate){
      this.updatedListener = this.storage.events.updated.attach(this.onUpdate);
    }
    if(this.onRecordUpdate){
      this.recordUpdatedListener = this.storage.events.recordUpdated.attach(this.onRecordUpdate);
    }
    if(this.onDelete){
      this.deletedListener = this.storage.events.deleted.attach(this.onDelete);
    }
    if(this.onRecordDeletion){
      this.recordDeletedListener = this.storage.events.recordDeleted.attach(this.onRecordDeletion);
    }
    /*
    if (!this.continuous) {
      console.log('materializeQuery is not continuous!');
    }
    */
    this.sink.sessionCall('query', {singleshot: this.singleshot, continuous: this.continuous, filter: this.filter||'*', visiblefields: this.visiblefields, limit: this.limit, offset: this.offset}).then(
      /*
      */
      this.onQueryDone.bind(this),
      this.onQueryDone.bind(this),
      this.decoder.onStream.bind(this.decoder)
    );
  };
  MaterializeQueryTask.prototype.onQueryDone = function () {
    if (!this.storage) {
      this.destroy();
      return;
    }
    this.storage.nullOp().then(
      this.destroy.bind(this),
      this.destroy.bind(this)
    );
  };
  MaterializeQueryTask.prototype.compulsoryConstructionProperties = ['data','sink'];
  return MaterializeQueryTask;
}

module.exports = createMaterializeQueryTask;

},{}],35:[function(require,module,exports){
function createReadFromDataSink(execlib, FromDataSinkBase) {
  'use strict';
  var lib = execlib.lib,
    q = lib.q;

  function ReadFromDataSink(prophash) {
    if (prophash && prophash.continuous) {
      console.warn('The "continuous" parameter is not supported by', this.constructor.name, 'any more, it is assumed to be "false"');
    }
    FromDataSinkBase.call(this,prophash);
    this.cb = prophash.cb;
    this.errorcb = prophash.errorcb;
    this.singleshot = prophash.singleshot;
    this.data = [];
    if (this.singleshot) {
      this.limit = 1;
    }
  }
  lib.inherit(ReadFromDataSink, FromDataSinkBase);
  ReadFromDataSink.prototype.__cleanUp = function () {
    this.data = null;
    this.singleshot = null;
    this.errorcb = null;
    this.cb = null;
    FromDataSinkBase.prototype.__cleanUp.call(this);
  };
  ReadFromDataSink.prototype.checkBeforeGo = function () {
    if (!this.cb) {
      throw new lib.Error('NO_CB_TO_REPORT_TO', 'Property hash provided to this instance of '+this.constructor.name+' has no cb to report data');
    }
  };
  ReadFromDataSink.prototype.handleSuccess = function () {
    if (this.cb) {
      this.cb(this.singleshot ? (this.data[0] || null) : this.data);
    }
  };
  ReadFromDataSink.prototype.handleError = function (reason) {
    if (this.errorcb) {
      this.errorcb(reason);
    }
  };
  ReadFromDataSink.prototype.handleRecord = function (record) {
    if (this.data) {
      this.data.push(record);
    }
  };
  ReadFromDataSink.prototype.compulsoryConstructionProperties = ['sink','cb'];

  return ReadFromDataSink;
}

module.exports = createReadFromDataSink;

},{}],36:[function(require,module,exports){
function createStreamFromDataSink(execlib, FromDataSinkBase) {
  'use strict';
  var lib = execlib.lib,
    q = lib.q;

  function StreamFromDataSink(prophash) {
    FromDataSinkBase.call(this,prophash);
    this.defer = prophash.defer;
  }
  lib.inherit(StreamFromDataSink, FromDataSinkBase);
  StreamFromDataSink.prototype.__cleanUp = function () {
    this.defer = null;
    FromDataSinkBase.prototype.__cleanUp.call(this);
  };
  StreamFromDataSink.prototype.checkBeforeGo = function () {
    if (!(this.defer &&
      lib.isFunction(this.defer.resolve) &&
      lib.isFunction(this.defer.reject) &&
      lib.isFunction(this.defer.notify))) {
      throw new lib.Error('NO_DEFER_TO_REPORT_TO', 'Property hash provided to this instance of '+this.constructor.name+' has no defer to report data');
    }
  };
  StreamFromDataSink.prototype.handleSuccess = function () {
    if (this.defer) {
      this.defer.resolve(true);
    }
  };
  StreamFromDataSink.prototype.handleError = function (reason) {
    if (this.defer) {
      this.defer.reject(reason);
    }
  };
  StreamFromDataSink.prototype.handleRecord = function (record) {
    if (this.defer) {
      this.defer.notify(record);
    }
  };
  StreamFromDataSink.prototype.compulsoryConstructionProperties = ['sink','defer'];

  return StreamFromDataSink;
}

module.exports = createStreamFromDataSink;

},{}],37:[function(require,module,exports){
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

  function container (masterarry, item) {
    return masterarry.indexOf(item)>=0;
  }
  function fixvisiblefields (queryprophash, uservisiblefields) {
    if (!lib.isArray(queryprophash.visiblefields)) {
      queryprophash.visiblefields = uservisiblefields;
      return;
    }
    queryprophash.visiblefields = queryprophash.visiblefields.filter(container.bind(null, uservisiblefields));
  }

  mylib.fixvisiblefields = fixvisiblefields;

  function isFilterExact (filter) {
    if (filter instanceof mylib.filterFactory.get('eq')) {
      return true;
    }
    if (filter instanceof mylib.filterFactory.get('and')) {
      return filter.filters.every(isFilterExact);
    }
    return false;
  }

  function amendToRecordFromExactFilter (record, filter) {
    var _r;
    if (filter instanceof mylib.filterFactory.get('eq')) {
      record.set(filter.fieldname, filter.fieldvalue);
      return;
    }
    if (filter instanceof mylib.filterFactory.get('and')) {
      _r = record;
      filter.filters.forEach(amendToRecordFromExactFilter.bind(null, _r));
      _r = null;
    }
  }

  mylib.filterUtils = {
    isExact: isFilterExact,
    amendToRecordFromExactFilter: amendToRecordFromExactFilter
  };
}

module.exports = createDataUtils;

},{}],38:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}]},{},[1]);
