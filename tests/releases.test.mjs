import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,mkdir,mkdtemp} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {releaseInfo} from '../shared/releases.mjs';
import {createApp} from '../server/index.mjs';
const root=fileURLToPath(new URL('..',import.meta.url));
test('installed version, bundled changelog and download target stay aligned; local route ships in the tool',async()=>{
  const pkg=JSON.parse(await readFile(path.join(root,'package.json'),'utf8')),info=releaseInfo(pkg.version);assert.equal(info.current.version,pkg.version);assert.equal(info.releases[0].version,pkg.version);assert.equal(info.downloadUrl,`https://github.com/spacesu851/ui-studio/releases/tag/v${pkg.version}`);assert.equal(info.packageUrl,`https://github.com/spacesu851/ui-studio/releases/download/v${pkg.version}/ui-studio.zip`);assert.throws(()=>releaseInfo('0.0.0'),/不一致/);
  const work=path.resolve(root,'../../work');await mkdir(work,{recursive:true});const folder=await mkdtemp(path.join(work,'release-page-')),app=await createApp({localCodex:false,dataDir:path.join(folder,'data'),exportRoot:path.join(folder,'exports'),production:true,aiEnvironment:{}}),http=app.listen(0,'127.0.0.1');await new Promise(r=>http.once('listening',r));const origin=`http://127.0.0.1:${http.address().port}`;
  try{const res=await fetch(origin+'/api/release');assert.equal(res.status,200);assert.deepEqual(await res.json(),info);const page=await fetch(origin+info.updatesPath);assert.equal(page.status,200);assert.match(page.headers.get('content-type'),/text\/html/);assert.equal((await fetch(origin+'/api/folders')).status,200);}finally{await new Promise(r=>http.close(r));app.locals.store.db.close()}
});
