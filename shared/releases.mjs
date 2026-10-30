import {changelogReleases} from '../site/updates/releases.mjs';
export function releaseInfo(version){
  const current=changelogReleases.find(r=>r.version===version);
  if(!current||changelogReleases[0]?.version!==version)throw new Error('工具版本与内置更新说明不一致，请一并更新 package.json 和更新数据。');
  return {version,current,releases:changelogReleases,updatesPath:'/updates/',sourceUrl:'https://github.com/spacesu851/ui-studio',allReleasesUrl:'https://github.com/spacesu851/ui-studio/releases',downloadUrl:current.releaseUrl,packageUrl:`https://github.com/spacesu851/ui-studio/releases/download/v${version}/ui-studio.zip`};
}
