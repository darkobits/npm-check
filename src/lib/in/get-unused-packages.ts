import _ from 'lodash';
import depcheck from 'depcheck';
import ora from 'ora';

import {State} from 'etc/types';


function skipUnused(currentState: State) {
  return currentState.get('skipUnused') ||        // manual option to ignore this
    currentState.get('global') ||               // global modules
    currentState.get('update') ||               // in the process of doing an update
    !currentState.get('cwdPackageJson').name;   // there's no package.json
}


function getSpecialParsers(currentState: State) {
  const specialsInput = currentState.get('specials');

  if (!specialsInput) {
    return;
  }

  return specialsInput
    .split(',')
    .map((special: any) => {
      // @ts-ignore
      return depcheck.special[special];
    })
    .filter(Boolean);
}


export default async function checkUnused(currentState: State) {
  const spinner = ora('Checking for unused packages. --skip-unused if you don\'t want this.');

  if (currentState.get('spinner')) {
    spinner.start();
  }

  if (skipUnused(currentState)) {
    return currentState;
  }

  const depCheckOptions = {
    ignoreDirs: [
      'sandbox',
      'dist',
      'generated',
      '.generated',
      'build',
      'fixtures',
      'jspm_packages'
    ],
    ignoreMatches: [
      'gulp-*',
      'grunt-*',
      'karma-*',
      'angular-*',
      'babel-*',
      'metalsmith-*',
      'eslint-plugin-*',
      '@types/*',
      'grunt',
      'mocha',
      'ava'
    ],
    specials: getSpecialParsers(currentState)
  };

  const depCheckResults = await depcheck(currentState.get('cwd'), depCheckOptions);

  spinner.stop();

  const unusedDependencies = [...depCheckResults.dependencies, ...depCheckResults.devDependencies];

  currentState.set('unusedDependencies', unusedDependencies);

  const cwdPackageJson = currentState.get('cwdPackageJson');

  // currently missing will return devDependencies that aren't really missing
  const missingFromPackageJson = _.omit(depCheckResults.missing || {}, Object.keys(cwdPackageJson.dependencies), Object.keys(cwdPackageJson.devDependencies));

  currentState.set('missingFromPackageJson', missingFromPackageJson);

  return currentState;
}
