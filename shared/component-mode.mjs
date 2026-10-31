// Only explicit, designer-authored CSS/SVG plans can compile without a model.
export function isLocalComponentPlan(plan,strategy='auto'){
 const mode=strategy==='auto'?plan?.strategy:strategy;
 return !!plan&&mode==='css'&&Array.isArray(plan.icons)&&plan.icons.every(icon=>icon?.type==='svg');
}
