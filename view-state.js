'use strict';
const Availability={
 resources(e,cost){return Object.entries(cost).map(([id,required])=>{const owned=id==='gold'?e.s.gold:e.material(id);return {id,name:id==='gold'?'金币':MATERIALS.find(m=>m.id===id)?.name||id,owned,required,shortfall:Math.max(0,required-owned),enough:owned>=required};});},
 state(e,cost,{locked='',max=false,ready='可以操作'}={}){const resources=this.resources(e,cost);return {kind:max?'max':locked?'locked':resources.some(r=>!r.enough)?'short':'ready',label:max?'已满级':locked?'尚未解锁':resources.some(r=>!r.enough)?'资源不足':ready,reason:max?'已达到最高等级':locked||'',resources};},
 building(e,b){const lv=e.lv(b.id),max=lv>=b.max;let locked='';if(e.lv('hall')<b.requires)locked='需要主厅 Lv.'+b.requires;else if(b.id==='hall'&&lv>=3&&e.s.cleared.filter(Boolean).length<lv-2)locked='需要先通关 '+(lv-2)+' 个区域';else if(b.id!=='hall'&&lv>=e.facilityCap(b))locked='需要升级营地主厅';return this.state(e,e.buildingCost(b),{locked,max,ready:lv?'可升级':'可建造'});},
 enhancement(e,slot){return this.state(e,e.enhanceCost(slot),{locked:!e.lv('workshop')?'需要先建造工坊':e.s.ranks[slot]>=e.lv('workshop')*5?'已达强化上限，需要升级工坊':'',ready:'可强化'});},
 crafting(e,region){return this.state(e,e.craftCost(region),{locked:!e.unlocked(region)?'需要先解锁该区域':e.lv('workshop')<region+1?'需要工坊 Lv.'+(region+1):'',ready:'可打造'});}
};
