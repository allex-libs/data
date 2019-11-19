function createDataDecoder(execlib, mylib){
  'use strict';
  var lib = execlib.lib,
      q = lib.q,
      filterFactory = mylib.filterFactory;

  //On any Errors from storable
  //Decoder will destroy self
  //and suppress the Error
  function Decoder(storable){
    this.storable = storable;
    this.queryID = null;
    this.destroyer = this.destroy.bind(this);
  }
  function destroyer (qi) {
    if (qi.destroy) {
      qi.destroy();
    }
  }
  Decoder.prototype.destroy = function(){
    this.destroyer = null;
    this.queryID = null;
    this.storable = null;
  };
  Decoder.prototype.onStream = function(item){
    //console.log('Decoder', this.storable.__id,'got',item);
    //console.log('Decoder got',require('util').inspect(item,{depth:null}));
    switch(item[0]){
      case 'i':
        this.setID(item[1]);
        break;
      case 'rb':
        this.beginRead(item[1]);
        break;
      case 're':
        this.endRead(item[1]);
        break;
      case 'r1':
        this.readOne(item[2]);
        break;
      case 'c':
        this.create(item[1]);
        break;
      case 'ue':
        this.updateExact(item[1], item[2]);
        break;
      case 'u':
        this.update(item[1], item[2]);
        break;
      case 'd':
        this.delete(item[1]);
        break;
    }
  };
  Decoder.prototype.setID = function (id) {
    if (!this.storable) {
      return;
    }
    this.queryID = id;
    return lib.q(true);
  };
  Decoder.prototype.beginRead = function(itemdata){
    if (!this.storable) {
      return;
    }
    return this.storable.beginInit(itemdata).then(null, this.destroyer);
  };
  Decoder.prototype.endRead = function(itemdata){
    if (!this.storable) {
      return;
    }
    return this.storable.endInit(itemdata).then(null, this.destroyer);
  };
  Decoder.prototype.readOne = function(itemdata){
    if (!this.storable) {
      return;
    }
    return this.storable.create(itemdata).then(null, this.destroyer);
  };
  Decoder.prototype.create = function(itemdata){
    if (!this.storable) {
      return;
    }
    return this.storable.create(itemdata).then(null, this.destroyer);
  };
  Decoder.prototype.delete = function(itemdata){
    var f;
    if (!this.storable) {
      return;
    }
    f = filterFactory.createFromDescriptor(itemdata);
    if(!f){
      console.error('NO FILTER FOR',itemdata);
      return lib.q(true);
    }else{
      //console.log(this.storable,this.storable.delete.toString(),'will delete');
      return this.storable.delete(f).then(null, this.destroyer);
    }
  };
  Decoder.prototype.updateExact = function(newitem, olditem){
    var f;
    if (!this.storable) {
      return;
    }
    f = filterFactory.createFromDescriptor({op:'hash',d:olditem});
    return this.storable.update(f,newitem).then(null, this.destroyer);
  };
  Decoder.prototype.update = function(filter, datahash){
    var f;
    if (!this.storable) {
      return;
    }
    f = filterFactory.createFromDescriptor(filter);
    return this.storable.update(f,datahash).then(null, this.destroyer);
  };
  return Decoder;
}

module.exports = createDataDecoder;
