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
