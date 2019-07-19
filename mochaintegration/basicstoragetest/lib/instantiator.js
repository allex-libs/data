function InstantiatorKlass () {
  this.manager = null;
  this.lastRecordCreated = null;
  this.lastRecordUpdate = null;
}
InstantiatorKlass.prototype.destroy = function () {
  this.lastRecordUpdate = null;
  this.lastRecordCreated = null;
  if (this.manager) {
    this.manager.destroy();
  }
  this.manager = null;
};
InstantiatorKlass.prototype.instantiateFrom = function (recorddescriptor, prophash) {
  this.manager = new allex_datalib.SpawningDataManager(new StorageKlass(lib.extend({
    record: recorddescriptor,
    events: true
  }, prophash)), null, recorddescriptor);
  recorddescriptor = null;
  this.manager.storage.events.newRecord.attach(this.onRecordCreated.bind(this));
  this.manager.storage.events.recordUpdated.attach(this.onRecordUpdated.bind(this));
  if (this.manager.storage.readyDefer) {
    return this.manager.storage.readyDefer.promise.then(
      qlib.returner(this.manager)
    );
  }
  return this.manager;
};
InstantiatorKlass.prototype.onRecordCreated = function (rec) {
  this.lastRecordCreated = rec;
  //console.log('onRecordCreated', this.lastRecordCreated);
};
InstantiatorKlass.prototype.onRecordUpdated = function () {
  this.lastRecordUpdate = Array.prototype.slice.call(arguments);
  //console.log('onRecordUpdated', this.lastRecordUpdate);
};


function instantiate (recorddescriptor, prophash) {
  setGlobal('Instantiator', new InstantiatorKlass());
  return Instantiator.instantiateFrom(recorddescriptor, prophash);
}
function goinstantiate (prophashfunc, recorddescriptor) {
  var ppres;
  if (!(lib.isVal(recorddescriptor) && 'fields' in recorddescriptor)) {
    throw new Error ('goinstantiate needs a recorddescriptor as its second parameter');
  }
  if (lib.isFunction(prophashfunc)) {
    ppres = prophashfunc();
    if (q.isThenable(ppres)) {
      return ppres.then(
        instantiate.bind(null, recorddescriptor),
        onErrorExit.bind(null, 1)
      );
    }
    return instantiate(recorddescriptor, ppres);
  }
  return instantiate(recorddescriptor, prophashfunc);
}

setGlobal('goinstantiate', goinstantiate);
