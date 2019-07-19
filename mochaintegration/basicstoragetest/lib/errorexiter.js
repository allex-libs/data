function onErrorExit (exitcode, e) {
  console.error(e);
  process.exit(exitcode);
}

setGlobal('onErrorExit', onErrorExit);

