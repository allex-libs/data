function createManagers (execlib, mylib) {
  'use strict';

  require('./creator')(execlib, mylib);
  require('./distributedcreator')(execlib, mylib);
  require('./spawningcreator')(execlib, mylib);
}

module.exports = createManagers;
