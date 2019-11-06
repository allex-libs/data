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
