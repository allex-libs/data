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
