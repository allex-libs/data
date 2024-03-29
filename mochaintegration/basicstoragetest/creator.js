function basicTestSequence (storageklassfunc, prophashfunc, recorddescriptor, initrecord, filter1, filter2, upsertrec) {
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
    return setGlobal('Manager', instantiateDataManager(prophashfunc, recorddescriptor));
  });
  it('Insert one', function () {
    this.timeout(1e7);
    return doCreate(Manager, initrecord);
  });
  it('Get that one', function () {
    this.timeout(1e7);
    return expect(onerecordreader(filter1)).to.eventually.be.ok.and.have.property('age', 55);
  });
  it('Update that one', function () {
    this.timeout(1e7);
    return doUpdate(Manager, filter1, {age: 59}, null, {name: 'andra', age: 55});
  });
  it('Reread that updated one', function () {
    this.timeout(1e7);
    return expect(onerecordreader(filter1)).to.eventually.be.ok.and.have.property('age', 59);
  });
  it('Upsert one', function () {
    this.timeout(1e7);
    return doUpdate(Manager, filter2, upsertrec, {upsert:true});
  });
  it('Reread that upserted one', function () {
    this.timeout(1e7);
    return expect(onerecordreader(filter2)).to.eventually.be.ok.and.have.property('age', 25);
  });
  it('Read all', function () {
    this.timeout(1e7);
    return expect(recordreader({}, void(0), 'recordreader')).to.eventually.be.an('array').and.have.deep.members([{name: 'andra', gender: 'm', age: 59},{name: 'lu', gender: 'm', age: 25}]);
  });
  it('Delete that upserted one', function () {
    this.timeout(1e7);
    return Manager.delete(filter2);
  });
  it('Prove that the upserted one was deleted', function () {
    this.timeout(1e7);
    return expect(onerecordreader(filter2)).to.eventually.be.null;
  });
  if (recorddescriptor.primaryKey) {
    it('Fail on inserting duplicate', function () {
      this.timeout(1e7);
      return expect(Manager.create(initrecord)).to.be.rejectedWith(Manager.storage.expectedPrimaryKeyViolation ? Manager.storage.expectedPrimaryKeyViolation : 'PRIMARY_KEY_VIOLATION');
    });
  }
  it('Delete the first one', function () {
    this.timeout(1e7);
    return Manager.delete(filter1);
  });
  it('Just wait a bit', function () {
    return q.delay(1000, true);
  });
  it('Destroy Instantiator and its Spawning Manager', function () {
    this.timeout(1e7);
    Instantiator.destroy();
  });
}

module.exports = function BasicStorageTest (storageklassfunc, prophashfunc) {
  var fields = [{
        name: 'name',
        type: 'string',
        sqltype: 'varchar(50)',
        nullable: false
      },{
        name: 'gender',
        type: 'string',
        sqltype: 'varchar(50)',
        nullable: false
      },{
        name: 'age',
        type: 'number',
        sqltype: 'int',
        nullable: false
      }],
      initrec = {
        name: 'andra',
        gender: 'm',
        age: 55
      };

  basicTestSequence(
    storageklassfunc,
    prophashfunc,
    {
      fields: fields
    },
    initrec,
    {op:'eq', field: 'name', value: 'andra'},
    {op:'eq', field: 'name', value: 'lu'},
    {gender: 'm', age: 25}
  );
  basicTestSequence(
    storageklassfunc,
    prophashfunc,
    {
      primaryKey: 'name',
      fields: fields
    },
    initrec,
    {op:'eq', field: 'name', value: 'andra'},
    {op:'eq', field: 'name', value: 'lu'},
    {gender: 'm', age: 25}
  );
  /*
  */

  basicTestSequence(
    storageklassfunc,
    prophashfunc,
    {
      primaryKey: ['name', 'gender'],
      fields: fields
    },
    initrec,
    {
      op: 'and',
      filters: [
        {op:'eq', field: 'name', value: 'andra'},
        {op:'eq', field: 'gender', value: 'm'}
      ]
    },
    {
      op: 'and',
      filters: [
        {op:'eq', field: 'name', value: 'lu'},
        {op:'eq', field: 'gender', value: 'm'}
      ]
    },
    {age: 25}
  );
};

