var _recorddescriptor = {
  primaryKey: 'name',
  fields: [{
    name: 'name',
    type: 'string'
  },{
    name: 'age',
    type: 'number'
  }]
}
  ,_andrafilter = {op:'eq', field: 'name', value: 'andra'}
  ,_lufilter = {op:'eq', field: 'name', value: 'lu'}
  ;
var _andrarecord = {
  name: 'andra',
  age: 55
};


module.exports = function BasicStorageTest (storageklassfunc, prophashfunc) {

  if (!lib.isFunction(storageklassfunc)) {
    throw new Error('BasicStorageTest needs the first argument to be a function that (eventually) returns a Storage Class');
  }

  if (!getGlobal('allex_datalib')) {
    loadClientSide(['allex:datafilters:lib', 'allex:data:lib']);
  }
  it('Get hold of Storage klass', function () {
    return setGlobal('StorageKlass', storageklassfunc());
  });
  it('Instantiate a Spawning Manager', function () {
    console.log('StorageKlass', StorageKlass.name);
    return setGlobal('Manager', goinstantiate(prophashfunc, _recorddescriptor));
  });
  it('Insert one', function () {
    return doCreate(Manager, _andrarecord);
  });
  it('Get that one', function () {
    return expect(onerecordreader(_andrafilter)).to.eventually.be.ok.and.have.property('age', 55);
  });
  it('Update that one', function () {
    return doUpdate(Manager, _andrafilter, {age: 59}, null, {name: 'andra', age: 55});
  });
  it('Reread that updated one', function () {
    return expect(onerecordreader(_andrafilter)).to.eventually.be.ok.and.have.property('age', 59);
  });
  it('Upsert one', function () {
    return doUpdate(Manager, _lufilter, {age: 25}, {upsert:true});
  });
  it('Reread that upserted one', function () {
    return expect(onerecordreader(_lufilter)).to.eventually.be.ok.and.have.property('age', 25);
  });
  it('Read all', function () {
    return expect(recordreader({}, void(0), 'recordreader')).to.eventually.be.an('array').and.have.deep.members([{name: 'andra', age: 59},{name: 'lu', age: 25}]);
  });
  it('Delete that upserted one', function () {
    return Manager.delete(_lufilter);
  });
  it('Prove that the upserted one was deleted', function () {
    return expect(onerecordreader(_lufilter)).to.eventually.be.null;
  });
  it('Fail on inserting duplicate', function () {
    return expect(Manager.create(_andrarecord)).to.be.rejectedWith('PRIMARY_KEY_VIOLATION');
  });
  it('Just wait a bit', function () {
    return q.delay(1000, true);
  });
  it('Destroy Instantiator and its Spawning Manager', function () {
    Instantiator.destroy();
  });

};

