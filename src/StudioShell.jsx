import React,{lazy,Suspense,useRef,Component} from 'react';
import './brand-theme.css';
const Interactions=lazy(()=>import('./StudioInteractions.jsx'));
class InteractionBoundary extends Component{
 state={failed:false};
 static getDerivedStateFromError(){return {failed:true}}
 render(){return this.state.failed?null:this.props.children}
}
export function StudioShell({children}){
 const scope=useRef(null);
 return <div ref={scope} className="studio-shell">{children}<InteractionBoundary><Suspense fallback={null}><Interactions scope={scope}/></Suspense></InteractionBoundary></div>;
}
