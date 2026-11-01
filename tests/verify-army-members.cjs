const fs=require('fs'),vm=require('vm'),assert=require('assert');
const ctx=vm.createContext({Math,Date});for(const name of ['content','engine'])vm.runInContext(fs.readFileSync(require('path').join(__dirname,'../dist/'+name+'.js'),'utf8'),ctx);
vm.runInContext(`
const assert=(ok,message)=>{if(!ok)throw Error(message)};
let e=new AdventureEngine();e.s.gold=100000;e.hire('sword',10);
assert(e.armyPage(0).entries.length===8&&e.armyPage(1).entries.length===2,'pagination');
let before=e.stats(),gold=e.s.gold,cost=e.memberTrainingCost('troop','sword',0);
assert(e.trainMember('troop','sword',0),'train');
assert(e.s.gold===gold-cost&&e.stats().power>before.power,'cost and actual combat power');
assert(e.memberLevel('troop','sword',0)===1&&e.memberLevel('troop','sword',1)===0,'individual training');
assert(e.memberTrainingCost('troop','sword',0)>cost,'increasing cost');
e=new AdventureEngine(JSON.parse(JSON.stringify(e.s)));
assert(e.memberLevel('troop','sword',0)===1&&e.armyPage(0).entries[0].level===1,'save reload');
e.trainMember('troop','sword',1);e.trainMember('troop','sword',1);
before=e.stats();e.s.hp=before.hp;e.dismissMember('troop','sword',0);
assert(e.troopCount()===9&&e.stats().power<before.power&&e.s.hp<=e.stats().hp,'dismiss changes combat stats and health cap');
assert(e.memberLevel('troop','sword',0)===2,'remaining member training retained');
e.s.gold=0;before=JSON.stringify(e.s);
assert(!e.trainMember('troop','sword',0)&&JSON.stringify(e.s)===before,'insufficient funds does not mutate');
assert(!e.dismissMember('troop','sword',-1)&&!e.trainMember('bad','sword',0),'invalid members');
e.s.monsters.test={id:'test',name:'测试狼',count:2,hp:30,attack:7,defense:1,region:0,kind:'normal'};
e.s.gold=10000;before=e.stats();
assert(e.trainMember('monster','test',0)&&e.stats().power>before.power,'monster training contributes');
assert(e.armyPage(1).entries.some(m=>m.kind==='monster'&&m.name==='测试狼'),'monsters listed');
before=e.stats();assert(e.dismissMember('monster','test',0)&&e.stats().power<before.power,'monster dismissal');
e.dismissMember('monster','test',0);assert(!e.s.monsters.test,'remove last monster');
while(e.troopCount())e.dismissMember('troop','sword',0);
assert(e.armyPage(999).page===0&&e.armyPage(999).entries.length===0,'empty page clamped');
e.hire('sword',1);assert(e.memberLevel('troop','sword',0)===0,'new hires do not inherit dismissed training');
e=new AdventureEngine();e.s.gold=100000;e.hire('sword',9);e.hire('shield',1);e.hire('bow',1);
for(const stat of ['hp','attack','defense']){
 const descending=[...e.armyPage(0,8,stat,'desc').entries,...e.armyPage(1,8,stat,'desc').entries];
 assert(descending.length===11&&descending.every((m,i)=>!i||descending[i-1][stat]>=m[stat]),'global descending '+stat);
 const ascending=[...e.armyPage(0,8,stat,'asc').entries,...e.armyPage(1,8,stat,'asc').entries];
 assert(ascending.every((m,i)=>!i||ascending[i-1][stat]<=m[stat]),'global ascending '+stat);
 assert(descending.every(m=>Number.isFinite(m.hp)&&Number.isFinite(m.attack)&&Number.isFinite(m.defense)),'tooltip attributes');
}
const strongest=e.armyPage(0,8,'attack','desc').entries[0];
assert(strongest.id==='bow','sort considers later pages');e.trainMember(strongest.kind,strongest.id,strongest.index);
assert(e.memberLevel('troop','bow',0)===1&&e.memberLevel('troop','sword',0)===0,'sorted action retains original identity');
const frozen=e.armyPage(0,20,'attack','desc').entries.map(({kind,id,index})=>({kind,id,index}));
for(let n=0;n<10;n++)e.trainMember('troop','sword',8);
const unchanged=e.armyPage(0,20,'attack','desc',frozen).entries;
assert(unchanged.map(m=>m.id+':'+m.index).join()===frozen.map(m=>m.id+':'+m.index).join(),'training preserves clicked sort order');
assert(unchanged.find(m=>m.id==='sword'&&m.index===8).level===10,'values still update');
assert(e.armyPage(0,20,'attack','desc').entries[0].id==='sword','explicit sorting uses upgraded stats');
assert(e.armyPage(1,8,'attack','desc',frozen).entries[0].id===frozen[8].id,'frozen order across pages');


`,ctx);
console.log('PASS: army pagination, individual/monster training, spending, actual combat changes, dismissal, save/reload, empty pages and invalid operations.');
