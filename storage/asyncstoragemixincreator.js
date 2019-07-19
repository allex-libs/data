function createAsyncStorageMixin (execlib, mylib) {
  var lib = execlib.lib,
    q = lib.q;

  function AsyncStorageMixin () {
    this.q = new lib.Fifo();
    this.readyDefer = q.defer();
    this.readyDefer.promise.then(this.setReady.bind(this));
  }
  AsyncStorageMixin.prototype.destroy = function () {
    if (this.readyDefer) {
      this.readyDefer.reject(new lib.Error('ALREADY_DESTROYED', 'This instance of '+this.constructor.name+' is being destroyed'));
    }
    this.readyDefer = null;
    if (this.q) {
      this.q.destroy();
    }
    this.q = null;
    this.destroyBoundProtoMethods();
  };
  AsyncStorageMixin.prototype.setReady = function () {
    //console.log('setReady', this.q.length, 'jobs on q');
    if (this.q) {
      this.q.drain(this.jobApplier.bind(this));
    }
  };
  AsyncStorageMixin.prototype.jobApplier = function (job) {
    this[job[0]].apply(this, job[1]);
  };

  AsyncStorageMixin.addMethods = function (klass, baseklassofklass) {
    var baseprototype;
    if (!baseklassofklass) {
      throw new Error('addMethods of AsyncStorageMixin needs the second parameter, the base Class of the implementing Class');
    }
    lib.inheritMethods(klass, AsyncStorageMixin
      ,'setReady'
      ,'jobApplier'
    );
    baseprototype = baseklassofklass.prototype;
    klass.prototype.doCreate = function (record, defer) {
      if (!this.readyDefer) {
        return;
      }
      if (!this.readyDefer.promise.inspect().state === 'fulfilled') {
        this.q.push(['doCreate', [record, defer]]);
        return;
      }
      return baseprototype.doCreate.call(this, record, defer);
    };
    klass.prototype.doRead = function (query, defer) {
      if (!this.readyDefer) {
        return;
      }
      if (!this.readyDefer.promise.inspect().state === 'fulfilled') {
        this.q.push(['doRead', [query, defer]]);
        return;
      }
      return baseprototype.doRead.call(this, query, defer);
    };
    klass.prototype.doUpdate = function (filter, datahash, options, defer) {
      if (!this.readyDefer) {
        return;
      }
      if (!this.readyDefer.promise.inspect().state === 'fulfilled') {
        this.q.push(['doUpdate', [filter, datahash, options, defer]]);
        return;
      }
      return baseprototype.doUpdate.call(this, filter, datahash, options, defer);
    };
    klass.prototype.doDelete = function (filter, defer) {
      if (!this.readyDefer) {
        return;
      }
      if (!this.readyDefer.promise.inspect().state === 'fulfilled') {
        this.q.push(['doDelete', [filter, defer]]);
        return;
      }
      return baseprototype.doDelete.call(this, filter, defer);
    };
    klass.prototype.destroyBoundProtoMethods = function () {
      baseprototype = null;
    };
  };
  mylib.AsyncStorageMixin = AsyncStorageMixin;
}

module.exports = createAsyncStorageMixin;
