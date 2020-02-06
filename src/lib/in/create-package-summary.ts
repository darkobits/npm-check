import path from 'path';

import _ from 'lodash';
import minimatch from 'minimatch';
import pathExists from 'path-exists';
import semver from 'semver';
import semverDiff from 'semver-diff';

import {State} from 'etc/types';
import readPackageJson from 'lib/in/read-package-json';
import getLatestFromRegistry from 'lib/in/get-latest-from-registry';
import findModulePath from 'lib/in/find-module-path';


export default function createPackageSummary(moduleName: string, currentState: State) {
    const cwdPackageJson = currentState.get('cwdPackageJson');

    const modulePath = findModulePath(moduleName, currentState);
    const packageIsInstalled = pathExists.sync(modulePath);
    const modulePackageJson = readPackageJson(path.join(modulePath, 'package.json'));

    // Ignore private packages
    const isPrivate = Boolean(modulePackageJson.private);
    if (isPrivate) {
        return false;
    }

    // Ignore packages that are using github or file urls
    const packageJsonVersion = cwdPackageJson.dependencies[moduleName] ||
        cwdPackageJson.devDependencies[moduleName] ||
        currentState.get('globalPackages')[moduleName];

    if (packageJsonVersion && !semver.validRange(packageJsonVersion)) {
        return false;
    }

    // Ignore specified '--ignore' package globs
    const ignore = currentState.get('ignore');
    if (ignore) {
        const ignoreMatch = Array.isArray(ignore) ? ignore.some(ignoredModule => minimatch(moduleName, ignoredModule)) : minimatch(moduleName, ignore);
        if (ignoreMatch) {
            return false;
        }
    }

    const unusedDependencies = currentState.get('unusedDependencies');
    const missingFromPackageJson = currentState.get('missingFromPackageJson');

    function foundIn(files: Array<any>) {
        if (!files) {
            return;
        }

        return `Found in: ${files.map(filepath => filepath.replace(currentState.get('cwd'), '')).join(', ')}`;
    }

    return getLatestFromRegistry(moduleName)
      .then((fromRegistry: any) => {
        const installedVersion = modulePackageJson.version;

        const latest = installedVersion && fromRegistry.latest && fromRegistry.next && semver.gt(installedVersion, fromRegistry.latest) ? fromRegistry.next : fromRegistry.latest;
        const versions = fromRegistry.versions || [];

        const versionWanted = semver.maxSatisfying(versions, packageJsonVersion);

        const versionToUse = installedVersion || versionWanted;
        const usingNonSemver = semver.valid(latest) && semver.lt(latest, '1.0.0-pre');

        const bump = semver.valid(latest) &&
          semver.valid(versionToUse) &&
          (usingNonSemver && semverDiff(versionToUse, latest) ? 'nonSemver' : semverDiff(versionToUse, latest));

        const unused = _.includes(unusedDependencies, moduleName);

        return {
          // info
          moduleName,
          homepage: fromRegistry.homepage,
          regError: fromRegistry.error,
          pkgError: modulePackageJson.error,

          // versions
          latest,
          installed: versionToUse,
          isInstalled: packageIsInstalled,
          notInstalled: !packageIsInstalled,
          packageWanted: versionWanted,
          packageJson: packageJsonVersion,

          // Missing from package json
          notInPackageJson: foundIn(missingFromPackageJson[moduleName]),

          // meta
          devDependency: _.has(cwdPackageJson.devDependencies, moduleName),
          usedInScripts: _.findKey(cwdPackageJson.scripts, script => {
            return script.indexOf(moduleName) !== -1;
          }),
          mismatch: semver.validRange(packageJsonVersion) && semver.valid(versionToUse) && !semver.satisfies(versionToUse, packageJsonVersion),
          semverValid: semver.valid(versionToUse), easyUpgrade: semver.validRange(packageJsonVersion) && semver.valid(versionToUse) && semver.satisfies(latest, packageJsonVersion) && bump !== 'major',
          bump,
          unused
        };
      });
}
