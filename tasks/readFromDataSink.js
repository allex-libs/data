function createReadFromDataSink(execlib) {
  'use strict';
  var lib = execlib.lib,
    q = lib.q,
    execSuite = execlib.execSuite,
    SinkTask = execSuite.SinkTask,
    readFromSinkProc = require('./proc/readFromSink').bind(null, execlib);

  function ReadFromDataSink(prophash) {
    SinkTask.call(this,prophash);
    this.sink = prophash.sink;
    this.filter = prophash.filter;
    this.visiblefields = prophash.visiblefields;
    this.cb = prophash.cb;
    this.errorcb = prophash.errorcb;
    this.singleshot = prophash.singleshot;
    this.continuous = prophash.continuous;
    this.limit = prophash.limit;
    this.offset = prophash.offset;
  }
  lib.inherit(ReadFromDataSink, SinkTask);
  ReadFromDataSink.prototype.__cleanUp = function () {
    this.offset = null;
    this.limit = null;
    this.continuous = null;
    this.singleshot = null;
    this.errorcb = null;
    this.cb = null;
    this.visiblefields = null;
    this.filter = null;
    this.sink = null;
    SinkTask.prototype.__cleanUp.call(this);
  };
  ReadFromDataSink.prototype.go = function () {
    readFromSinkProc({
      sink: this.sink,
      singleshot: this.singleshot,
      continuous: this.continuous,
      filter: this.filter,
      visiblefields: this.visiblefields,
      limit: this.limit,
      offset: this.offset,
      cb: this.cb,
      errorcb: this.errorcb
    });
    this.destroy();
  };
  ReadFromDataSink.prototype.compulsoryConstructionProperties = ['sink','cb'];

  return ReadFromDataSink;
}

module.exports = createReadFromDataSink;
