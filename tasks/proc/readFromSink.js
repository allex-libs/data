function createReadFromSinkProc (execlib, prophash) {
  'use strict';
  var data = [],
    error = null,
    initialized = false,
    sinkDestroyedListener = prophash.sink.destroyed.attach(onSinkDestroyed),
    lib = execlib.lib,
    execSuite = execlib.execSuite,
    taskRegistry = execSuite.taskRegistry,
    task;

  function finish () {
    try {
    if(sinkDestroyedListener) {
      sinkDestroyedListener.destroy();
    }
    sinkDestroyedListener = null;
    if (error) {
      if (prophash.errorcb) {
        prophash.errorcb(error);
      }
    } else {
      if (prophash.cb) {
        if (prophash.singleshot) {
          prophash.cb(data[0] || null);
        } else {
          prophash.cb(data);
        }
      }
    }
    if (task) {
      task.destroy();
    }
    task = null;
    initialized = null;
    error = null;
    data = null;
    prophash = null;
    } catch(e) {
      console.error(e.stack);
      console.error(e);
    }
  }

  function onSinkDestroyed (allok) {
    if (!initialized) {
      error = new lib.Error('DATA_CORRUPTION_ON_CONNECTION_BREAKDOWN', 'Data connection broke during data read');
    }
    finish();
  }

  function onRecord (datahash) {
    if (prophash && prophash.singleshot) {
      if (data.length) {
        if ('function' === typeof data.destroy) {
          data.destroy();
        }
      }
      return;
    }
  }

  function onInitiated() {
    //console.log('onInitiated');//, prophash);
    initialized = true;
    if (!prophash.continuous) {
      finish();
    }
  }

  task = taskRegistry.run('materializeQuery', {
    sink: prophash.sink,
    continuous: prophash.continuous, //true,
    singleshot: prophash.singleshot,
    data: data,
    filter: prophash.filter,
    visiblefields: prophash.visiblefields,
    limit: prophash.limit,
    offset: prophash.offset,
    onRecordCreation: onRecord,
    onInitiated: onInitiated
  });
}

module.exports = createReadFromSinkProc;
