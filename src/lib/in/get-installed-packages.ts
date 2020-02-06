import path from 'path';

import _ from 'lodash';
import globby from 'globby';
import readPackageJson from 'lib/in/read-package-json';


export default function getInstalledPackages(cwd: string) {
  const GLOBBY_PACKAGE_JSON = '{*/package.json,@*/*/package.json}';
  const installedPackages = globby.sync(GLOBBY_PACKAGE_JSON, {cwd});

  return _(installedPackages)
    .map(pkgPath => {
        const pkg = readPackageJson(path.resolve(cwd, pkgPath));
        return [pkg.name, pkg.version];
    })
    .fromPairs()
    .valueOf();
}
