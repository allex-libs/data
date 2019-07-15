function createStorage (execlib, mylib) {
  'use strict';

  require('./basecreator')(execlib, mylib);
  require('./nullcreator')(execlib, mylib);
  require('./clonecreator')(execlib, mylib);
  require('./memorybasecreator')(execlib, mylib);
  require('./asyncmemorystoragebasecreator')(execlib, mylib);
  require('./memorycreator')(execlib, mylib);
  require('./memorylistcreator')(execlib, mylib);
  mylib.storageRegistry.register('memory', mylib.MemoryStorage);
  mylib.storageRegistry.register('memorylist', mylib.MemoryListStorage);
}

module.exports = createStorage;
