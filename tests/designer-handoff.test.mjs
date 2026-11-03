import test from 'node:test';
import assert from 'node:assert/strict';
import {codexFollowup} from '../shared/codex-followup.mjs';
import {splitProgress,elapsedLabel} from '../shared/ai-progress.mjs';
test('follow-up carries UI, element, task and version identifiers without treating an old task as a new publication',()=>{
 const text=codexFollowup({origin:'http://127.0.0.1:4763',uiId:'UI-12345678',version:2,taskId:'SPLIT-1234567890123456',assetId:'EL-12345678',name:'测试按钮'});
 for(const id of ['UI-12345678','EL-12345678','SPLIT-1234567890123456','v2'])assert.ok(text.includes(id));
 assert.match(text,/保留其他素材 ID/);assert.match(text,/已发布的任务不能重复绑定另一版本/);assert.match(text,/是否满意、继续处理或交付由设计师决定/);
});
test('progress describes files available to the designer instead of a visual pass threshold',()=>{
 const job={status:'failed',assets:[{file:'00.png'},{status:'failed',previewAvailable:true},{status:'pending'}]};
 const state=splitProgress(job);assert.equal(state.generated,2);assert.equal(state.pending,1);assert.equal(state.stopped,true);assert.equal(state.blocked,job.assets[1]);assert.equal(elapsedLabel('bad',0),'');assert.equal(elapsedLabel('2026-11-03T00:00:00Z',Date.parse('2026-11-03T00:01:05Z')),'1分05秒');
});
