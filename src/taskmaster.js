export const AGENTS=[
 {id:'planner',name:'Planner',role:'Break the request into concrete ordered tasks and dependencies.'},
 {id:'architect',name:'Architect',role:'Choose architecture, interfaces, data flow and constraints.'},
 {id:'coder',name:'Coder',role:'Implement the assigned task and keep changes focused.'},
 {id:'reviewer',name:'Reviewer',role:'Review implementation for correctness, security and maintainability.'},
 {id:'tester',name:'Tester',role:'Design and run tests, identify regressions and edge cases.'}
];
export function buildPlan(tasks){ return tasks.map((t,i)=>({...t,id:t.id||`task-${i+1}`,dependsOn:t.dependsOn||[],priority:t.priority||'medium',status:t.status||'todo'})); }
export function readyTasks(tasks){ return tasks.filter(t=>t.status==='todo' && (t.dependsOn||[]).every(id=>tasks.find(x=>x.id===id)?.status==='done')); }
export function assignAgents(tasks){ return buildPlan(tasks).map((t,i)=>({...t,agent:t.agent||AGENTS[i%AGENTS.length].id})); }
export const TASKMASTER_SYSTEM=`You are a multi-agent coding taskmaster. Produce a dependency-aware plan. Separate planning, architecture, implementation, review and testing. Independent tasks may run in parallel. Never mark a task done without evidence.`;
