
import _ from 'lodash';
import chalk from 'chalk';

import {State} from 'etc/types';
import installPackages from 'lib/out/install-packages';
import emoji from 'lib/out/emoji';


export default async function updateAll(currentState: State) {
  const packages = currentState.get('packages');

  if (currentState.get('debug')) {
    console.log('packages', packages);
  }

  const packagesToUpdate = packages.filter((packageEntry: any) => packageEntry.mismatch || packageEntry.notInstalled || packageEntry.bump);

  if (!packagesToUpdate.length) {
    console.log(`${emoji(':heart:  ')}Your modules look ${chalk.bold('amazing')}. Keep up the great work.${emoji(' :heart:')}`);
    return;
  }

  const saveDependencies = packagesToUpdate
    .filter((pkg: any) => !pkg.devDependency)
    .map((pkg: any) => `${pkg.moduleName}@${pkg.latest}`);

  const saveDevDependencies = packagesToUpdate
    .filter((pkg: any) => pkg.devDependency)
    .map((pkg: any) => `${pkg.moduleName}@${pkg.latest}`);

  const updatedPackages = packagesToUpdate
    .map((pkg: any) => `${pkg.moduleName}@${pkg.latest}`).join(', ');

  if (!currentState.get('global')) {
    if (saveDependencies.length) {
      saveDependencies.unshift('--save');
    }

    if (saveDevDependencies.length) {
      saveDevDependencies.unshift('--save-dev');
    }
  }

  await installPackages(saveDependencies, currentState);
  await installPackages(saveDevDependencies, currentState);

  console.log('');
  console.log(chalk.green('[npm-check] Update complete!'));
  console.log(chalk.green(`[npm-check] ${updatedPackages}`));
  console.log(chalk.green('[npm-check] You should re-run your tests to make sure everything works with the updates.'));

  return currentState;
}
