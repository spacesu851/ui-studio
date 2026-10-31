import React,{Component,Suspense,lazy,useCallback,useMemo,useRef,useState} from 'react';
const Controller=lazy(()=>import('./StudioMotionController.jsx'));
class MotionFailure extends Component {
 state={failed:false};
 static getDerivedStateFromError(){return {failed:true}}
 render(){return this.state.failed?null:this.props.children}
}
// The optional controller renders no DOM and never delays the usable content.
export function StudioMotion({scope,motionKey,selector,order=0,kind='stage'}){
 const started=useMemo(()=>performance.now(),[motionKey]);
 return <MotionFailure><Suspense fallback={null}><Controller scope={scope} motionKey={motionKey} selector={selector} order={order} kind={kind} started={started}/></Suspense></MotionFailure>;
}
export function MotionBackdrop({children,className='',...props}){
 const scope=useRef(null),[mounted,setMounted]=useState(false);
 const attach=useCallback(node=>{scope.current=node;if(node)setMounted(true)},[]);
 return <div {...props} ref={attach} className={'modal-backdrop gsap-modal '+className}>{mounted&&<StudioMotion scope={scope} motionKey="dialog" selector=":scope > .modal" kind="dialog"/>}{children}</div>;
}
