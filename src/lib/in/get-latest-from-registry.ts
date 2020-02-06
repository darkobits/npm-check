import os from 'os';

import _ from 'lodash';
import semver from 'semver';
import packageJson from 'package-json';
import throat from 'throat';

import bestGuessHomepage from 'lib/in/best-guess-homepage';


const cpuCount = os.cpus().length;

// TODO: Replace with p-queue.
const foo = throat(cpuCount);


export default async function getNpmInfo(packageName: string) {
  try {
    const rawData = await foo(() => packageJson(packageName, {
      fullMetadata: true,
      allVersions: true
    }));

    const CRAZY_HIGH_SEMVER = '8000.0.0';

    const sortedVersions = _(rawData.versions)
      .keys()
      // @ts-ignore
      .remove(_.partial(semver.gt, CRAZY_HIGH_SEMVER))
      .sort(semver.compare)
      .valueOf();

    const latest = rawData['dist-tags'].latest;
    const next = rawData['dist-tags'].next;
    const latestStableRelease = semver.satisfies(latest, '*') ? latest : semver.maxSatisfying(sortedVersions, '*');

    return {
      latest: latestStableRelease,
      next,
      versions: sortedVersions,
      homepage: bestGuessHomepage(rawData)
    };
  } catch (err) {
    const errorMessage = `Registry error ${err.message}`;

    return {
      error: errorMessage
    };
  }
}
