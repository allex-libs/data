var lR = ALLEX.execSuite.libRegistry;
lR.register('allex_datalib',require('./libindex')(
  ALLEX,
  lR.get('allex_datafilterslib')
));
