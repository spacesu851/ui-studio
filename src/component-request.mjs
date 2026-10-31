export class ComponentRequestError extends Error {
 constructor(message,status=0){super(message);this.name='ComponentRequestError';this.status=status;}
}
export async function componentRequest(route,{body,signal,fetcher=fetch}={}){
 let response;
 try{response=await fetcher('/api'+route,{...(body===undefined?{}:{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}),signal});}
 catch(error){if(error.name==='AbortError')throw new ComponentRequestError('请求已停止，尚未收到处理结果');throw new ComponentRequestError('无法连接本机 UI Studio 服务，请检查工具是否仍在运行后重试。');}
 let result;try{result=await response.json()}catch{throw new ComponentRequestError(`服务没有返回有效结果（HTTP ${response.status}），请稍后重试。`,response.status)}
 if(!response.ok)throw new ComponentRequestError(result.error||`处理失败（HTTP ${response.status}）`,response.status);
 return result;
}
export async function requestComponentPlan(uiId,input,{onProgress=()=>{},signal,fetcher=fetch}={}){
 onProgress('checking');
 const settings=await componentRequest('/ai/settings',{signal,fetcher});
 if(!settings.configured&&settings.engine==='codex')throw new ComponentRequestError((settings.localCodex?.message||'未连接本地 Codex')+'。本次没有开始分析；请在本机登录 Codex 后检查连接，也可导入本地 Codex 已制作的方案。',428);
 if(!settings.configured)throw new ComponentRequestError('这台电脑尚未配置 AI 服务，本次没有开始分析。已有组件可直接预览；新素材可配置 AI 服务，或导入本地 Codex 制作的方案。',428);
 onProgress('analyzing');
 const result=await componentRequest(`/ui/${uiId}/html-component/plan`,{body:input,signal,fetcher});
 if(!result.plan||!Array.isArray(result.plan.texts)||!Array.isArray(result.plan.icons))throw new ComponentRequestError('分析没有返回完整候选方案，请重试或导入方案。');
 return result;
}
