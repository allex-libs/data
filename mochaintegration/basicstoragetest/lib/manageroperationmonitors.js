function eqchecker (hash, item, itemname) {
  if (hash[itemname] !== item) {
    console.error('Problematic hash', hash);
    return 'Mismatch on '+itemname+', it is '+item+', should have been '+hash[itemname];
  }
}
function eqcheck(small, big) {
  return lib.traverseShallowConditionally(small, eqchecker.bind(null, big));
}
function eqdecide (smallhash, bighash, correctresult) {
  var eqc = eqcheck(smallhash, bighash);
  return eqc ? new Error(eqc) : correctresult;
}
function eqQdecide (smallhash, bighash, correctresult) {
  var eqc = eqcheck(smallhash, bighash);
  return eqc ? q.reject(new Error(eqc)) : q(correctresult);
}
  

function doCreateEnder (ntfs, result) {
  return eqQdecide(Instantiator.lastRecordCreated, result, result);
}
function doCreateNotifier (ntfs, item) {
  console.log('doCreateNotifier', item);
}
function doCreate (manager, datahash) {
  var _dh = datahash,
    cp = manager.create(datahash),
    ntfs = [],
    _ns = ntfs;
  cp.then(
    doCreateEnder.bind(null, _ns),
    null,
    doCreateNotifier.bind(null, _dh, _ns)
  );
  _dh = null;
  _ns = null;
  return cp;
}

function doUpdateEnder (filter, updatehash, options, ntfs, result) {
  //too complicated to use the filter still
  if (result && result.upserted) {
    if (options && options.upsert) {
      /*
      console.log('it was an upsert');
      console.log('filter', filter);
      console.log('updatehash', updatehash);
      console.log('result', result, Instantiator.lastRecordCreated);
      */
      return eqQdecide(updatehash, Instantiator.lastRecordCreated, result);
    }
    return q.reject(new Error('Upsert done but it was not asked for in the options'));
  }
  if (ntfs.length<1) {
    return q.reject(new Error('No updates were fired during Update'));
  }
  if (ntfs[0] instanceof Error) {
    return q.reject(ntfs[0]);
  }
  return q(result);
}
function doUpdateNotifier (updatehash, ntfs, oldhash, item) {
  var newhash, oldc;
  //console.log('doUpdateNotifier', item);
  if (lib.isArray(item) && item[0] === 'ue') {
    newhash = item[1];
    if (lib.isVal(oldhash)) {
      oldc = eqcheck(oldhash, item[2]);
      if (oldc) {
        console.error('old hash', oldhash, 'check failed', oldc, 'vs', item[2]);
      }
    }
    ntfs.push(eqdecide(updatehash, newhash, item[1]));
  }
}
function doUpdate (manager, filter, updatehash, options, oldhash) {
  var _f = filter,
    _uh = updatehash,
    _o = options,
    up = manager.update(filter, updatehash, options),
    ntfs = [],
    _ns = ntfs,
    ret;
  ret = up.then(
    doUpdateEnder.bind(null, _f, _uh, _o, _ns),
    null,
    doUpdateNotifier.bind(null, _uh, _ns, oldhash)
  );
  _f = null;
  _uh = null;
  _o = null;
  _ns = null;
  return ret;
}

setGlobal('doCreate', doCreate);
setGlobal('doUpdate', doUpdate);
