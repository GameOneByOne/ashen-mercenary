const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const root=path.join(__dirname,'../dist/'),c=vm.createContext({console,Date,Math});vm.runInContext(fs.readFileSync(root+'content.js','utf8')+'\n'+fs.readFileSync(root+'engine.js','utf8'),c);const run=code=>vm.runInContext(code,c);
run('let e=new AdventureEngine(null,()=>.99);');assert.equal(run('REGIONS.length'),16);assert.equal(run('MATERIALS.length'),32);assert.equal(run('new Set(REGIONS.flatMap(r=>r.pool)).size'),32);assert.equal(run('Object.keys(SLOTS).length'),13);assert(run('REGIONS.every(r=>r.normals.length>=4&&r.elites.length>=2&&r.elites.length<=3&&r.bossName)'));
// Victory never heals; experience level-up does not heal either.
run("e.s.hp=70;e.s.xp=79;e.victory(e.monsterTemplate(0,'normal',0));");assert.equal(run('e.s.hp'),70);assert.equal(run('e.s.level'),2);
// Camp actually heals, manual return stops automatic re-entry.
run('e.returnCamp(true);e.tick(1)');assert(run('e.s.hp>70'));assert.equal(run('e.s.mode'),'camp');assert.equal(run('e.s.resume'),false);
// Discovery creates a manual challenge, not an automatic boss.
run("e.s.scouted[0]=REGIONS[0].scoutNeed;e.victory(e.monsterTemplate(0,'normal',0));");assert.equal(run('e.s.discovered[0]'),true);assert.equal(run('e.enemy'),null);assert.equal(run('e.s.mode'),'exploring');assert.equal(run('e.unlocked(1)'),false);run('e.s.hp=e.stats().hp');assert.equal(run('e.challenge(0)'),true);assert.equal(run('e.enemy.kind'),'boss');run('e.victory(e.enemy)');assert.equal(run('e.unlocked(1)'),true);assert.equal(run('e.s.special'),undefined);assert.equal(run('e.s.mode'),'camp');assert.equal(run('e.s.resume'),false);assert.equal(run('e.challenge(0)'),false);
// Death, delay and recovery.
run("e=new AdventureEngine(null,()=>.99);e.s.mode='combat';e.s.hp=1;e.enemy=e.monsterTemplate(5,'normal',0);e.enemyClock=10;e.tick(1)");assert.equal(run('e.s.mode'),'camp');assert.equal(run('e.s.hp'),0);assert.equal(run('e.s.deaths'),1);assert(run('e.s.deadUntil>0'));run('for(let n=0;n<22;n++)e.tick(1)');assert(run('e.s.hp>0'));
// Overkill must not amplify lifesteal.
run("e=new AdventureEngine(null,()=>.99);e.s.equipped.ring={id:'leech',slot:'ring',stats:{attack:1000,lifesteal:25}};e.s.hp=100;e.s.retreat=0;e.enemy=e.monsterTemplate(0,'normal',0);e.enemy.hp=4;e.s.mode='combat';e.playerClock=10;e.tick(1)");assert.equal(run('e.s.hp'),101);
// Recruitment produces stronger elite creatures and respects caps.
run("e=new AdventureEngine(null,()=>0);e.s.equipped.mask={slot:'mask',stats:{intimidation:100}};e.tryRecruit(e.monsterTemplate(0,'elite',0));");assert.equal(run('e.monsterCount()'),1);assert(run("Object.values(e.s.monsters)[0].attack>TROOPS[0].attack*4"));run("for(let n=0;n<10;n++)e.tryRecruit(e.monsterTemplate(0,'normal',0));");assert.equal(run('e.monsterCount()'),5);
// Thousands of troops, leader buff and batch affordability.
run("e.s.camp.barracks=8;e.s.gold=1e9;");assert.equal(run("e.hire('sword',1000)"),true);assert.equal(run('e.troopCount()'),1000);const before=run('e.stats().troop.attack');run("e.s.equipped.charm={slot:'charm',stats:{leadership:100}}");assert.equal(run('e.stats().troop.attack'),before*2);assert.equal(run("e.hire('bow',5000)"),false);
// A full set contains exactly thirteen supported slots; equip does not heal.
run("e=new AdventureEngine(null,()=>.2);e.s.hp=50;for(const slot of Object.keys(SLOTS)){let i=e.makeItem(1,'elite',slot);e.receiveItem(i);e.equip(i.id);}");assert.equal(run('Object.keys(e.s.equipped).length'),13);assert.equal(run('e.s.hp'),50);assert(run('Number.isFinite(e.stats().power)'));
// Building gates, upgrades, materials, trade and salvage.
run("e.s.gold=1e9;MATERIALS.forEach(m=>e.s.materials[m.id]=1000);");assert.equal(run("e.build('altar')"),false);assert.equal(run("e.build('workshop')"),true);assert.equal(run("e.enhance('mainhand')"),true);assert.equal(run("e.craft(0,'ring')"),true);assert.equal(run("e.craft(15,'ring')"),false);run("e.s.camp.hall=3;e.s.cleared[0]=true;");assert.equal(run("e.build('academy')"),true);run("let g=e.makeItem(0);e.receiveItem(g);let itemId=g.id;");assert.equal(run('e.salvage(itemId)'),true);run("e.build('market')");assert.equal(run("e.sellMaterial('m0-0',-2)"),false);assert.equal(run("e.sellMaterial('m0-0',3)"),true);
// Offline respects injury/camp and never creates a boss battle automatically.
run("e=new AdventureEngine(null,()=>.99);e.s.hp=10;e.s.resume=false;let offline=e.offline(120);");assert.equal(run('e.s.hp'),run('e.stats().hp'));assert.equal(run('e.s.kills'),0);run("e.s.discovered[0]=true;e.start();e.offline(120)");assert(run("!e.enemy||e.enemy.kind!=='boss'"));assert(run('e.s.hp<=e.stats().hp'));run("e.returnCamp(true);e.s.hp=e.stats().hp;e.challenge(0);e.offline(60)");assert.equal(run('e.s.mode'),'camp');assert.equal(run('e.s.cleared[0]'),false);
// Drop quality and advanced material pools.
run("e=new AdventureEngine(null,()=>.01);let boss=e.makeItem(15,'boss');");assert(run('boss.quality>=2'));assert.equal(run('boss.region'),15);assert(run('e.lootChance(\'elite\').material>e.lootChance(\'normal\').material'));
console.log('PASS: 16 areas/bosses, 32 materials, 13 slots, persistent wounds, death/camp, manual bosses, actual-damage lifesteal, monster recruitment, 1000-unit army, leadership, construction/crafting/trading/salvage, offline behavior.');

// Legacy saves retain earned stats and progress while retiring special inventory.
run("e=new AdventureEngine();let legacy=JSON.parse(JSON.stringify(e.s));legacy.special={potion:5,scroll:2,seal:3};legacy.bonusInsight=6;legacy.cleared[0]=true;legacy.gold=999;e=new AdventureEngine(legacy,()=>0);");
assert.equal(run('e.s.special'),undefined);assert.equal(run('e.stats().insight'),6);assert.equal(run('e.s.gold'),999);assert.equal(run('e.unlocked(1)'),true);
assert.equal(run("typeof e.useSpecial"),'undefined');assert.equal(run("'special' in e.lootChance('boss')"),false);
run("for(const kind of ['normal','elite','boss'])e.victory(e.monsterTemplate(0,kind,0))");
assert(run("e.events.every(x=>x.data?.type!=='special')"));assert.equal(run('e.s.special'),undefined);
// Altar uses gold and ordinary materials, including upgrades and save/reload.
run("e.s.camp.hall=3;e.s.gold=1e8;MATERIALS.forEach(m=>e.s.materials[m.id]=1000);let altar=BUILDINGS.find(b=>b.id==='altar');let altarCost=e.buildingCost(altar);let goldBefore=e.s.gold;");
assert(run("Object.keys(altarCost).every(k=>k==='gold'||MATERIALS.some(m=>m.id===k))"));assert.equal(run("e.build('altar')"),true);assert.equal(run('e.s.gold'),run('goldBefore-altarCost.gold'));assert.equal(run('e.lv(\'altar\')'),1);
assert.equal(run("e.build('altar')"),true);run('e=new AdventureEngine(JSON.parse(JSON.stringify(e.s)))');assert.equal(run("e.lv('altar')"),2);assert(run('Number.isFinite(e.stats().power)'));
console.log('PASS: legacy save migration, earned insight, no special drops, altar gold/material upgrades and reload.');

run("e=new AdventureEngine(null,()=>.99);e.s.discovered[0]=true;e.challenge(0);e.enemy.hp=1;e.offline(60,{resumeBoss:true})");assert.equal(run('e.s.cleared[0]'),true);
run("e=new AdventureEngine(null,()=>.99);e.s.camp.hall=16;e.s.camp.barracks=23;e.s.gold=1e15;MATERIALS.forEach(m=>e.s.materials[m.id]=10000);e.build('barracks')");assert.equal(run('e.troopCap()'),6050);console.log('PASS: manually started bosses continue in background; maximum 6050 troop capacity is reachable.');
