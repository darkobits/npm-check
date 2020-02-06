import chalk from 'chalk';
import execa from 'execa';
import ora from 'ora';

import {State} from 'etc/types';


export default async function install(packages: Array<any>, currentState: State) {
  const installer = currentState.get('installer');
  const spinner = ora(`Installing using ${chalk.green(installer)}...`);

  try {
    if (!packages.length) {
      return Promise.resolve(currentState);
    }

    const installGlobal = currentState.get('global') ? '--global' : false;
    const saveExact = currentState.get('saveExact') ? '--save-exact' : false;
    const color = chalk.supportsColor ? '--color=always' : false;

    const npmArgs = [
      'install',
      installGlobal,
      saveExact,
      color
    ].filter(Boolean) as Array<string>;


    console.log('');
    console.log(`$ ${chalk.green(installer)} ${chalk.green(npmArgs.join(' '))}`);

    if (currentState.get('spinner')) {
      spinner.start();
    }

    const output = await execa(installer, npmArgs, {cwd: currentState.get('cwd')});

    spinner.stop();
    console.log(output.stdout);
    console.log(output.stderr);

    return currentState;
  } catch (err) {
    spinner.stop();
    throw err;
  }
}
