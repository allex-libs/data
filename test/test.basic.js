

describe ('Basic Tests', function () {
  it('Load Lib', function () {
    return setGlobal('Lib', require('..')(execlib));
  });
});
