function createQueries (execlib, mylib) {
  'use strict';

  require('./basecreator')(execlib, mylib);
  require('./staticcreator')(execlib, mylib);
  require('./clonecreator')(execlib, mylib);
}

module.exports = createQueries;
