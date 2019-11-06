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
