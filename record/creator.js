function createRecord(execlib, outerlib, mylib){
  'use strict';
  var lib = execlib.lib;

  function DefaultHandler(desc){
    var evaldesc;
    this.proc = null;
    this._value = desc;
    if(lib.isString(desc) && desc.length>4 && desc.indexOf('{{')===0 && desc.lastIndexOf('}}')===desc.length-2){
      evaldesc = desc.substring(2, desc.length-2);
      this.proc = function(destructionhash){
        if (destructionhash && destructionhash.__dodestroy===true) {
          evaldesc = null;
          return;
        }
        return eval(evaldesc);
      };
    }
    if('undefined' === typeof this._value){
      this._value = null;
    }
  }
  DefaultHandler.prototype.destroy = function(){
    if (this.proc) {
      this.proc({__dodestroy: true});
    }
    this.proc = null;
    this._value = null;
  };
  DefaultHandler.prototype.value = function(){
    if(this.proc){
      return this.proc();
    }
    return this._value;
  };

  function Field(prophash){
    this.name = prophash.name;
    if(!this.name){
      console.error(prophash);
      throw new Error("Field needs a name");
    }
    this.type = prophash.type;
    this.value = prophash.value;
    this.default = new DefaultHandler(prophash.default);
  }
  Field.prototype.destroy = function(){
    this.default.destroy();
    this.default = null;
    this.value = null;
    this.type = null;
    this.name = null;
  };
  Field.prototype.valueFor = function(val){
    var und;
    if(val===und){
      return this.default.value();
    }
    //TODO: validate
    return val;
  };

  function filterOut(sourcefields, visiblefields) {
    var ret = sourcefields.reduce(function (result, field) {
      if (visiblefields.indexOf(field.name) >= 0) {
        result.push(field);
      }
      return result;
    }, []);
    visiblefields = null;
    return ret;
  }

  function Record(p_prophash,visiblefields){
    var prophash = lib.extend({}, p_prophash);
    if(!(prophash && prophash.fields)){
      console.trace();
      throw new Error("Record needs the fields array in its property hash");
    }
    if (lib.isArray(visiblefields)) {
      prophash.fields = filterOut(prophash.fields, visiblefields);
    }
    this.primaryKey = prophash.primaryKey;
    this.templateObj = outerlib.ObjectHive.give(prophash.fields);
    //this.objCtor = prophash.objCtor || createRecordObjectCtor(prophash.fields);
    this.fields = [];
    this.fieldsByName = new lib.Map();
    //this.hashTemplate = createHashTemplate(prophash.fields);
    prophash.fields.forEach(this.addField.bind(this,visiblefields));
    visiblefields = null;
  }
  Record.prototype.destroy = function(){
    if (this.templateObj) {
      outerlib.ObjectHive.dec(this.templateObj);
    }
    //this.hashTemplate = null;
    this.fieldsByName.destroy();
    this.fieldsByName = null;
    lib.arryDestroyAll(this.fields);
    this.fields = null;
    //this.objCtor = null;
    this.templateObj = null;
    this.primaryKey = null;
  };
  Record.prototype.isEmpty = function(){
    return this.fields.length<1;
  };
  Record.prototype.addField = function(visiblefields,fielddesc){
    if(visiblefields && visiblefields.indexOf(fielddesc.name)<0){
      return;
    }
    var field = new Field(fielddesc);
    this.fields.push(field);
    this.fieldsByName.add(field.name,field);
  };
  Record.prototype.createTemplateHash = function () {
    var ret;
    try {
      eval (this.templateObj.template);
    } catch(e) {
      return {};
    }
    return ret;
  };
  function hashFiller(prophash, obj, field) {
    prophash[field.name] = field.valueFor(obj[field.name]);
  }
  Record.prototype.filterHash = function(obj){
    var prophash, fs, l, i, f, fn;//{};
    if (!this.fields) {
      return {};
    }
    prophash = this.createTemplateHash();
    fs = this.fields;
    l=fs.length;
    //this.fields.forEach(hashFiller.bind(null, prophash, obj));
    for(i=0; i<l; i++) {
      f = fs[i];
      fn = f.name;
      prophash[fn] = f.valueFor(obj[fn]);
    }
    obj = null;
    return prophash;
  };
  Record.prototype.filterObject = function(obj){
    return new(this.templateObj.ctor)(this.filterHash(obj));
  };
  function putter(fbn, ret, val, name) {
    var f = fbn.get(name);
    if(f) {
      ret[name] = f.valueFor(val);
    }
  }
  Record.prototype.filterOut = function(obj){
    var ret = {}, _r = ret;
    lib.traverseShallow(obj, putter.bind(null, this.fieldsByName, _r));
    _r = null;
    return ret;
  };
  Record.prototype.filterStateStream = function(item){
    if(item.p && item.p.length===1){
      if(item.o==='u'){
        var f = this.fieldsByName.get(item.p[0]);
        if(f){
          var ret = {};
          ret[f.name] = f.valueFor(item.d[0]);
          return ret;
        }
      }
      if(item.o==='s'){
        var f = this.fieldsByName.get(item.p[0]);
        if(f){
          var ret = {};
          ret[f.name] = f.valueFor(item.d);
          return ret;
        }
      }
    }
  };
  Record.prototype.stateStreamFilterForRecord = function(storage,record){
    return new StateStreamFilter(storage,record,this);
  };
  Record.prototype.updatingFilterDescriptorFor = function(datahash){
    var ret;
    if(this.primaryKey){
      if(lib.isArray(this.primaryKey)){
        ret = {op: 'and', filters : this.primaryKey.map(function(pkfield){
          return {
            op: 'eq', field: pkfield, value:datahash[pkfield]
          };
        })};
        datahash = null;
        return ret;
      }else{
        return {op:'eq',field:this.primaryKey,value:datahash[this.primaryKey]};
      }
    }else{
      return {op:'hash',d:this.filterObject(datahash)};
    }
  };
  Record.prototype.defaultFor = function(fieldname){
    var f = this.fieldsByName.get(fieldname);
    if(f){
      return f.valueFor();
    }else{
      return null;
    }
  };

  function StateStreamFilter(manager,recordinstance,record){
    this.manager = manager;
    this.recordinstance = recordinstance;
    this.record = record;
  }
  StateStreamFilter.prototype.destroy = function(){
    this.record = null;
    this.recordinstance = null;
    this.manager = null;
  };
  StateStreamFilter.prototype.onStream = function(item){
    var val = this.record.filterStateStream(item);
    if(val){
      this.manager.update(this.record.updatingFilterDescriptorFor(this.recordinstance),val, {op:'set'});
    }
  };
  mylib.Record = Record;
}

module.exports = createRecord;
