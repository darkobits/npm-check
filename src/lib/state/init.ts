import fs from 'fs';
import path from 'path';

import _ from 'lodash';
import chalk from 'chalk';
import globalDirs from 'global-dirs';

import {State} from 'etc/types';
import readPackageJson from 'lib/in/read-package-json';
import globalPackages from 'lib/in/get-installed-packages';
import emoji from 'lib/out/emoji';


export default async function init(currentState: State, userOptions: any): Promise<State> {
  return new Promise((resolve, reject) => {
    Object.entries(userOptions).forEach(([key, value]) => {
      currentState.set(key, value);
    });

    if (currentState.get('global')) {
      let modulesPath = globalDirs.npm.packages;

      if (process.env.NODE_PATH) {
        if (process.env.NODE_PATH.indexOf(path.delimiter) !== -1) {
          modulesPath = process.env.NODE_PATH.split(path.delimiter)[0];
          console.log(chalk.yellow('warning: Using the first of multiple paths specified in NODE_PATH'));
        } else {
          modulesPath = process.env.NODE_PATH;
        }
      }

    if (!fs.existsSync(modulesPath)) {
      throw new Error(`Path "${modulesPath}" does not exist. Please check the NODE_PATH environment variable.`);
    }

    console.log(chalk.green(`The global path you are searching is: ${modulesPath}`));

    currentState.set('cwd', globalDirs.npm.packages);
    currentState.set('globalPackages', globalPackages(modulesPath));
    } else {
      const cwd = path.resolve(currentState.get('cwd'));
      const pkg = readPackageJson(path.join(cwd, 'package.json'));
      currentState.set('cwdPackageJson', pkg);
      currentState.set('cwd', cwd);
    }

    emoji.enabled(currentState.get('emoji'));

    if (currentState.get('cwdPackageJson').error) {
      reject(currentState.get('cwdPackageJson').error);
    } else {
      resolve(currentState);
    }
  });
}
