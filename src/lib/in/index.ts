
import extend from 'xtend';
import ora from 'ora';

import {State} from 'etc/types';
import getUnusedPackages from 'lib/in/get-unused-packages';
import createPackageSummary from 'lib/in/create-package-summary';


function dependencies(pkg: any, currentState: State) {
  if (currentState.get('global')) {
    return currentState.get('globalPackages');
  }

  if (currentState.get('ignoreDev')) {
    return pkg.dependencies;
  }

  if (currentState.get('devOnly')) {
    return pkg.devDependencies;
  }

  return extend(pkg.dependencies, pkg.devDependencies);
}


export default async function main(currentState: State) {
  // N.B. This modifies currentState in-place.
  await getUnusedPackages(currentState);

  const spinner = ora('Checking npm registries for updated packages.');

  // spinner.isEnabled = spinner.isEnabled && currentState.get('spinner');
  // spinner.start();
  if (!spinner.isSpinning && currentState.get('spinner')) {
    spinner.start();
  }

  const cwdPackageJson = currentState.get('cwdPackageJson');

  const allDependencies = dependencies(cwdPackageJson, currentState);
  const allDependenciesIncludingMissing = Object.keys(extend(allDependencies, currentState.get('missingFromPackageJson')));

  const arrayOfPackageInfo = allDependenciesIncludingMissing
    .map(moduleName => createPackageSummary(moduleName, currentState))
    .filter(Boolean);

  currentState.set('packages', arrayOfPackageInfo);

  spinner.stop();

  return currentState;
}
