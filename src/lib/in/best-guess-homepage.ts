// @ts-ignore
import gitUrl from 'giturl';


export default function bestGuessHomepage(data: any): string | false {
  if (!data) {
    return false;
  }

  const packageDataForLatest = data.versions[data['dist-tags'].latest];

  if (packageDataForLatest.homepage) {
    return packageDataForLatest.homepage;
  }

  if (packageDataForLatest.bugs && packageDataForLatest.bugs.url) {
    return gitUrl.parse(packageDataForLatest.bugs.url.trim());
  }

  if (packageDataForLatest.repository && packageDataForLatest.repository.url) {
    return gitUrl.parse(packageDataForLatest.repository.url.trim());
  }

  return false;
}
