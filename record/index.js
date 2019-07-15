function createSuite(execlib, mylib){
  'use strict';

  var suite = {};
  require('./utils')(execlib,suite);

  require('./creator')(execlib, mylib, suite);
  
  mylib.recordSuite = suite;
};

module.exports = createSuite;
