function notifreader (howmany, records, d, item) {
  if (lib.isArray(item)) {
    if (item[0] === 'r1') {
      records.push(item[2]);
      if (lib.isNumber(howmany) && records.length===howmany) {
        d.resolve (howmany===1 ? item[2] : records);
      }
    }
    if (item[0] === 're') {
      d.resolve(lib.isNumber(howmany) ? (records.length===howmany ? records : null) : records);
    }
  }
}
function recordreader (filterdesc, howmany, caption) {
  var d = q.defer(), retd = q.defer(), records = [], qry, ret;
  qry = Manager.addQuery(1, {filter: filterdesc}, d);
  d.promise.then(qry.destroy.bind(qry), null, notifreader.bind(null, howmany, records, retd));
  howmany = null;
  records = null;
  ret = qlib.promise2console(retd.promise, caption);
  retd = null;
  return ret;
}
function onerecordreader (filterdesc) {
  return recordreader(filterdesc, 1, 'onerecordreader');
}

setGlobal('recordreader', recordreader);
setGlobal('onerecordreader', onerecordreader);

