describe('Test Integration', function () {
  loadMochaIntegration('allex_datalib');
  //BasicStorageTest(function () {return allex_datalib.MemoryMapStorage;});
  BasicStorageTest(function () {return allex_datalib.MemoryStorage;});
});
