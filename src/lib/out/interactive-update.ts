import _ from 'lodash';
import chalk from 'chalk';
import stringLength from 'string-length';
import inquirer from 'inquirer';
import table from 'text-table';

import {State} from 'etc/types';
import installPackages from 'lib/out/install-packages';
import emoji from 'lib/out/emoji';


const UI_GROUPS = [{
  title: chalk.bold.underline.green('Update package.json to match version installed.'),
  filter: {mismatch: true, bump: undefined}
}, {
  title: `${chalk.bold.underline.green('Missing.')} ${chalk.green('You probably want these.')}`,
  filter: {notInstalled: true, bump: undefined}
}, {
  title: `${chalk.bold.underline.green('Patch Update')} ${chalk.green('Backwards-compatible bug fixes.')}`,
  filter: {bump: 'patch'}
}, {
  title: `${chalk.yellow.underline.bold('Minor Update')} ${chalk.yellow('New backwards-compatible features.')}`,
  bgColor: 'yellow',
  filter: {bump: 'minor'}
}, {
  title: `${chalk.red.underline.bold('Major Update')} ${chalk.red('Potentially breaking API changes. Use caution.')}`,
  filter: {bump: 'major'}
}, {
  title: `${chalk.magenta.underline.bold('Non-Semver')} ${chalk.magenta('Versions less than 1.0.0, caution.')}`,
  filter: {bump: 'nonSemver'}
}];


function label(pkg: any) {
  const bumpInstalled = pkg.bump ? pkg.installed : '';
  const installed = pkg.mismatch ? pkg.packageJson : bumpInstalled;
  const name = chalk.yellow(pkg.moduleName);
  const type = pkg.devDependency ? chalk.green(' devDep') : '';
  const missing = pkg.notInstalled ? chalk.red(' missing') : '';
  const homepage = pkg.homepage ? chalk.blue.underline(pkg.homepage) : '';
  return [
    `${name}${type}${missing}`,
    installed,
    installed && '❯',
    chalk.bold(pkg.latest || ''),
    pkg.latest ? homepage : pkg.regError || pkg.pkgError
  ];
}


function short(pkg: any) {
  return `${pkg.moduleName}@${pkg.latest}`;
}


function choice(pkg: any) {
  if (!pkg.mismatch && !pkg.bump && !pkg.notInstalled) {
    return false;
  }

  return {
    value: pkg,
    name: label(pkg),
    short: short(pkg)
  };
}


function unselectable(options?: any) {
  return new inquirer.Separator(chalk.reset(options ? options.title : ' '));
}


function createChoices(packages: Array<any>, options: any) {
  const filteredChoices = packages.filter(options.filter);

  const choices: Array<any> = filteredChoices.map(choice).filter(Boolean);

  const choicesAsATable = table(choices.map((c: any) => c.name), {
    align: ['l', 'l', 'l'],
    stringLength
  }).split('\n');

  const choicesWithTableFormating = choices.map((c, i) => {
    c.name = choicesAsATable[i];
    return c;
  });

  if (choicesWithTableFormating.length) {
    choices.unshift(unselectable(options));
    choices.unshift(unselectable());
    return choices;
  }
}


export default async function interactive(currentState: State) {
  const packages = currentState.get('packages');

  if (currentState.get('debug')) {
    console.log('packages', packages);
  }

  const choicesGrouped = UI_GROUPS.map(group => createChoices(packages, group)).filter(Boolean);

  const choices = choicesGrouped.flat();

  if (!choices.length) {
    console.log(`${emoji(':heart:  ')}Your modules look ${chalk.bold('amazing')}. Keep up the great work.${emoji(' :heart:')}`);
    return;
  }

  choices.push(unselectable());
  choices.push(unselectable({title: 'Space to select. Enter to start upgrading. Control-C to cancel.'}));

  const questions = [{
    name: 'packages',
    message: 'Choose which packages to update.',
    type: 'checkbox',
    choices: choices.concat(unselectable()),
    pageSize: process.stdout.rows - 2
  }];

  const answers = await inquirer.prompt(questions);

  const packagesToUpdate = answers.packages as Array<any>;

  if (!packagesToUpdate || !packagesToUpdate.length) {
    console.log('No packages selected for update.');
    return false;
  }

  const saveDependencies = packagesToUpdate
    .filter(pkg => !pkg.devDependency)
    .map(pkg => `${pkg.moduleName}@${pkg.latest}`);

  const saveDevDependencies = packagesToUpdate
    .filter(pkg => pkg.devDependency)
    .map(pkg => `${pkg.moduleName}@${pkg.latest}`);

  const updatedPackages = packagesToUpdate
    .map(pkg => `${pkg.moduleName}@${pkg.latest}`).join(', ');

  if (!currentState.get('global')) {
    if (saveDependencies.length) {
      saveDependencies.unshift('--save');
    }

    if (saveDevDependencies.length) {
      saveDevDependencies.unshift('--save-dev');
    }
  }

  const currentState2 = await installPackages(saveDependencies, currentState);
  const currentState3 = await installPackages(saveDevDependencies, currentState2);

  console.log('');
  console.log(chalk.green('[npm-check] Update complete!'));
  console.log(chalk.green(`[npm-check]  ${updatedPackages}`));
  console.log(chalk.green('[npm-check] You should re-run your tests to make sure everything works with the updates.'));

  return currentState3;
}
