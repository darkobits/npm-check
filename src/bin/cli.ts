#!/usr/bin/env node

import cli from '@darkobits/saffron';
import createCallsiteRecord from 'callsite-record';
import detectPreferredPM from 'preferred-pm';

import npmCheck from 'lib/index';
import staticOutput from 'lib/out/static-output';
import interactiveUpdate from 'lib/out/interactive-update';
import updateAll from 'lib/out/update-all';
import debug from 'lib/state/debug';


// Refactor this.
// const pkg = require('../../package.json');
// updateNotifier({pkg}).notify();


async function detectPreferredInstaller(cwd: string) {
  const SUPPORTED_INSTALLERS = ['npm', 'pnpm', 'ied'];
  const preferredPM = await detectPreferredPM(cwd);
  return preferredPM && SUPPORTED_INSTALLERS.indexOf(preferredPM.name) !== -1 ? preferredPM.name : 'npm';
}


cli.command({
  command: '* [path]',
  builder: ({command}) => {
    command.positional('path', {
      type: 'string',
      description: 'Where to check. Defaults to current directory. Use -g for checking global modules.'
    });

    command.option('update', {
      type: 'boolean',
      describe: 'Interactive update.',
      alias: 'u',
      conflicts: ['update-all'],
      default: false,
      required: false
    });

    command.option('update-all', {
      type: 'boolean',
      describe: 'Non-interactive update. Apply all updates without prompting.',
      alias: 'y',
      conflicts: ['update'],
      default: false,
      required: false
    });

    command.option('global', {
      type: 'boolean',
      describe: 'Look at global modules.',
      alias: 'g',
      default: false,
      required: false
    });

    command.option('skip-unused', {
      type: 'boolean',
      describe: 'Skip check for unused packages.',
      alias: 's',
      default: false,
      required: false
    });

    command.option('production', {
      type: 'boolean',
      describe: 'Skip devDependencies.',
      alias: 'p',
      conflicts: ['dev-only'],
      default: false,
      required: false
    });

    command.option('dev-only', {
      type: 'boolean',
      describe: 'Look at devDependencies only (skip dependencies).',
      alias: 'd',
      conflicts: ['production'],
      default: false,
      required: false
    });

    command.option('ignore', {
      type: 'string',
      describe: 'Ignore dependencies based on succeeding glob.',
      alias: 'i',
      required: false
    });

    command.option('save-exact', {
      type: 'boolean',
      describe: 'Save exact version (x.y.z) instead of caret (^x.y.z) in package.json.',
      alias: 'E',
      default: false,
      required: false
    });

    command.option('specials', {
      type: 'string',
      describe: 'List of depcheck specials to include in check for unused dependencies.',
      required: false
    });

    command.option('color', {
      type: 'boolean',
      describe: 'Force or disable color output.',
      default: true,
      required: false
    });

    command.option('emoji', {
      type: 'boolean',
      describe: 'Remove emoji support. (Defaults to false in CI environments.)',
      default: true,
      required: false
    });

    command.option('debug', {
      type: 'boolean',
      describe: 'Debug output. Throw in a gist when creating issues on GitHub.',
      default: false,
      required: false
    });

    command.example('$0', 'See what can be updated, what isn\'t being used.');

    command.example('$0 ../foo', 'Check another path.');

    command.example('$0 -gu', 'Update globally installed modules by picking which ones to upgrade.');
  },
  handler: async ({argv}) => {
    const options = {
      cwd: argv.input[0] || argv.flags.dir,
      update: argv.update,
      updateAll: argv.updateAll,
      global: argv.global,
      skipUnused: argv.skipUnused,
      ignoreDev: argv.production,
      devOnly: argv.devOnly,
      saveExact: argv.saveExact,
      specials: argv.specials,
      emoji: argv.emoji,
      debug: argv.debug,
      ignore: argv.ignore,
      // Undocumented.
      installer: process.env.NPM_CHECK_INSTALLER || 'auto',
      spinner: argv.spinner
    };

    try {
      console.log('Got arguments:', argv);
      console.log('Got options:', options);

      if (options.debug) {
        debug('cli.flags', argv.flags);
        debug('cli.input', argv.input);
      }

      const installer = options.installer === 'auto' ? await detectPreferredInstaller(options.cwd) : options.installer;
      options.installer = installer;
      const currentState = await npmCheck(options);

      currentState.inspectIfDebugMode();

      if (options.updateAll) {
        await updateAll(currentState);
        return;
      }

      if (options.update) {
        await interactiveUpdate(currentState);
        return;
      }

      staticOutput(currentState);
    } catch (err) {
      console.log(err.message);

      if (options.debug) {
        const rec = createCallsiteRecord(err);

        if (rec) {
          console.log(rec.renderSync({}));
        }
      } else {
        console.log('For more detail, add `--debug` to the command');
      }

      throw err;
    }
  }
});


cli.init();
