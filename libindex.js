function createDataLib(execlib, datafilterslib){
  'use strict';
  var execSuite = execlib.execSuite,
    mylib = {
      storageRegistry: new execSuite.RegistryBase()
    };
  require('./objectcreator')(execlib, mylib);
  require('./record')(execlib, mylib);
  require('./utils')(execlib, mylib);
  mylib.filterFactory = datafilterslib;
  require('./query')(execlib, mylib);
  var DataCoder = require('./codercreator')(execlib),
      DataDecoder = require('./decodercreator')(execlib, mylib),
      streamSourceCreator = execSuite.streamSourceCreator;
  mylib.DataSource = streamSourceCreator(DataCoder);
  mylib.DataDecoder = DataDecoder;
  mylib.StreamDistributor = require('./distributorcreator')(execlib);
  require('./managers')(execlib, mylib);
  require('./storage')(execlib, mylib);

  execlib.execSuite.taskRegistry.register('allex_datalib', require('./taskcreator')(execlib, mylib));

  return mylib;
}

module.exports = createDataLib;
