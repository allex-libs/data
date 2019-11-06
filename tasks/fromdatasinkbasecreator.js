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
