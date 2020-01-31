function createRecordUtils(execlib,suite){
  'use strict';
  var lib = execlib.lib;
  function selectFieldIfDuplicate(targetfieldname,foundobj,fieldnames,hash){
    var targetfieldvalue = hash[targetfieldname];
    if(targetfieldvalue in fieldnames){
      foundobj.found = hash[namefieldname];
      return true;
    }
    fieldnames[targetfieldvalue] = true;
  }

  function duplicateFieldValueInArrayOfHashes(fieldname,fieldnames,arrayofhashes){
    var foundobj = {},
      fieldChecker = selectFieldIfDuplicate.bind(fieldname,foundobj,fieldnames);
    for(var i=2; i<arguments.length; i++){
      console.log('checking',arguments[i]);
      arguments[i].some(fieldChecker);
      if(foundobj.found){
        return foundobj.found;
      }
    }
  }

  function checkIfInvalidRd(fieldnames,rd){
    if(!(rd && 'object' === typeof rd)){
      return "not an object";
    }
    if(!rd.fields){
      return "has no fields";
    }

  }

  function copyExceptFields(obj,item,itemname){
    if(itemname!=='fields'){
      obj[itemname] = item;
    }
  }
  function inherit(rd1,rd2){//rd <=> recorddescriptor
    var result = {fields:[]}, fn={};
    for(var i=0; i<arguments.length; i++){
      var rd = arguments[i], 
        invalid = checkIfInvalidRd(fn,rd);
      if(invalid){
        continue;
        //throw new Error((rd ? JSON.stringify(rd) : rd) + " is not a valid record descriptor: "+invalid);
      }
      lib.traverse(rd,copyExceptFields.bind(null,result));
      result.fields.push.apply(result.fields,rd.fields);
    }
    return result;
  }

  function pushIfNotInLookupArray(lookuparry,destarry,item){
    if(lookuparry.indexOf(item)<0){
      destarry.push(item);
    }
  }
  function copyAndAppendNewElements(a1,a2){
    var ret = a1.slice();
    if(lib.isArray(a2)){
      a2.forEach(pushIfNotInLookupArray.bind(null,a1,ret));
    }
    return ret;
  }
  suite.copyAndAppendNewElements = copyAndAppendNewElements;
  suite.duplicateFieldValueInArrayOfHashes = duplicateFieldValueInArrayOfHashes;
  suite.inherit = inherit;
}

module.exports = createRecordUtils;
