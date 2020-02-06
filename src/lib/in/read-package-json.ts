import extend from 'xtend';


export default function readPackageJson(filename: string) {
  let pkg;
  let error;

  try {
    pkg = require(filename);
  } catch (err) {
    error = err.code === 'MODULE_NOT_FOUND'
     ? new Error(`A package.json was not found at ${filename}`)
     : new Error(`A package.json was found at ${filename}, but it is not valid.`);
  }

  return extend({
    devDependencies: {},
    dependencies: {},
    error
  }, pkg);
}
