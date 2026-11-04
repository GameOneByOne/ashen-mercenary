'use strict';
const STAT_NAMES={hp:'生命',attack:'攻击',defense:'防御',insight:'洞察',speed:'速度',greed:'贪婪',intimidation:'威慑',leadership:'领袖',lifesteal:'吸血'};
const MATERIAL_GROUPS=[['硬木','铁矿','兽皮','药草','亚麻','石料'],['赤铜','利齿','树脂','煤炭','蛛丝','兽骨'],['魔晶','秘银','铁木','荧光孢子','厚皮'],['余烬','寒髓','魔兽血','精金','符文墨'],['龙鳞','虚空精华','龙骨','月华石','不灭火种'],['星陨石','神铁','源初结晶','虚空之核','时之砂']];
const MATERIALS=MATERIAL_GROUPS.flatMap((names,star)=>names.map((name,n)=>({id:`m${star}-${n}`,name,star,price:3*4**star})));
const SLOTS={head:{name:'头',primary:'hp',base:45},shoulder:{name:'肩',primary:'defense',base:3},bracer:{name:'护腕',primary:'defense',base:3},mainhand:{name:'主手',primary:'attack',base:10},offhand:{name:'副手',primary:'attack',base:5},gloves:{name:'手套',primary:'attack',base:4},chest:{name:'胸甲',primary:'defense',base:6},belt:{name:'腰带',primary:'hp',base:40},legs:{name:'护腿',primary:'defense',base:4},boots:{name:'鞋子',primary:'speed',base:3},charm:{name:'挂饰',primary:'insight',base:4},ring:{name:'戒指',primary:'attack',base:4},mask:{name:'面具',primary:'insight',base:3}};
const REGION_DATA=[
['低语林地','苔冠树王',['灰鬃狼','迷途树精','林地盗匪','棘背野猪','枯叶虫'],['狼群头领','荆棘卫士'],'m0-0 m0-2',0,1],
['废弃矿坑','赤铁巨像',['洞穴蝙蝠','矿洞蜘蛛','碎石怪','矿坑鼠','盗矿者'],['重甲监工','铁牙蛛母','岩壳守卫'],'m0-1 m0-5',0,2],
['河湾农庄','腐沼巨兽',['河湾蛙','流浪佣兵','泥沼怪','荒田猎犬','芦苇蛇'],['沼泽祭司','芦苇猎手'],'m0-3 m0-4',0,3],
['风蚀荒原','蛮角暴君',['荒原鬣狗','食腐鸟','流亡斥候','沙地蜥蜴','尖角兽'],['獠牙狂战士','风蚀巨蝎','掠夺队长'],'m1-0 m1-1',1,4],
['幽光湿地','千丝蛛后',['幽光蛾','毒藤妖','湿地蜥蜴','雾行者','树脂软泥'],['剧毒织网者','幽光术士'],'m1-2 m1-4',1,5],
['沉骨墓园','白骨摄政',['骸骨兵','墓园犬','游魂','煤灰行尸','墓穴甲虫'],['持盾骸将','提灯亡魂','骸骨法师'],'m1-3 m1-5',1,7],
['暮色遗迹','失落的执政官',['遗迹卫士','残破傀儡','晶石蜥蜴','幽影骑手','碎甲幽灵'],['守夜骑士','魔晶术士'],'m2-0 m2-1',2,9],
['铁木密林','古根吞噬者',['铁木树精','荧光蜥蜴','血藤','腐木甲虫','猎食花'],['铁木守护者','孢子先知','密林猎主'],'m2-2 m2-3',2,11],
['兽王高地','裂山兽王',['厚皮犀兽','山地巨狼','高地猎鹰','角兽','石背熊'],['裂齿领主','重角战兽'],'m2-4',2,13],
['霜寂雪岭','凛冬之心',['霜牙狼','冰晶傀儡','雪岭猿','冰翼鸟','冻土爬虫'],['寒霜女巫','雪岭巨人','精金卫士'],'m3-1 m3-3',3,15],
['赤焰熔炉','熔火铸造者',['火舌蜥蜴','熔岩虫','灰烬工兵','余烬魔','符墨傀儡'],['熔炉监工','赤焰祭司'],'m3-0 m3-2 m3-4',3,17.5],
['龙骨峡谷','古龙残魂',['翼骨兽','龙裔斥候','峡谷飞龙','龙骨犬','岩翼鸟'],['龙鳞战将','骸龙巫师','翼骨骑士'],'m4-0 m4-2',4,20],
['月隐圣殿','无月之主',['月影侍从','暗银傀儡','圣殿幽灵','银眼兽','石像守卫'],['月华祭司','不灭守卫'],'m4-3 m4-4',4,22.5],
['虚空裂隙','吞星者',['虚空行者','无面哨兵','裂隙猎犬','影织虫','虚空水母'],['裂隙吞噬者','无面君侯','影刃执事'],'m4-1',4,25],
['星陨圣所','陨星审判者',['陨星骑士','星尘傀儡','神铁卫士','结晶幼体','星轨猎兽'],['陨星巨像','源初观测者'],'m5-0 m5-1 m5-2',5,27.5],
['长夜王庭','长夜君王',['王庭禁卫','时砂幻影','虚空侍卫','长夜猎犬','失序骑士'],['终夜执行官','时砂领主','虚核卫队'],'m5-3 m5-4',5,30]
];
const REGIONS=REGION_DATA.map((r,i)=>{const scale=1.85**i,bossFactor=3*1.35**i;return {id:i,name:r[0],bossName:r[1],normals:r[2],elites:r[3],pool:r[4].split(' '),star:r[5],targetDay:r[6],scale,hp:Math.round(75*scale),attack:Math.round(8*scale),defense:Math.round(2*scale),gold:Math.round(8*1.67**i),xp:Math.round(14*1.55**i),scoutNeed:(i<5?3600:i<10?16000:22000),bossHp:Math.round(10500*scale*bossFactor),bossAttack:Math.round(105*scale*bossFactor),bossDefense:Math.round(25*scale*bossFactor),bossPower:Math.round(2300*scale*bossFactor)};});
const TROOPS=[{id:'sword',name:'佣兵剑士',price:32,attack:3,defense:.15,hp:9},{id:'shield',name:'佣兵盾卫',price:38,attack:1.3,defense:.5,hp:20},{id:'bow',name:'佣兵射手',price:40,attack:4.2,defense:.05,hp:5}];
const BUILDINGS=[
{id:'hall',name:'营地主厅',desc:'扩展营地规模，开放其他设施。',effect:'每级开放更高设施等级',max:16,requires:0,cost:100,mat:8},
{id:'workshop',name:'工坊',desc:'强化装备槽位，打造指定部位。',effect:'每级允许槽位强化上限 +5，锻造对应等级区域装备',max:16,requires:1,cost:130,mat:10},
{id:'barracks',name:'兵营',desc:'容纳并训练大规模佣兵。',effect:'容量 +250 / 级；佣兵基础属性 +8% / 级',max:24,requires:1,cost:160,mat:10},
{id:'infirmary',name:'医务所',desc:'在营地恢复生命。',effect:'营地每秒恢复率 +1%；死亡休整时间缩短',max:16,requires:1,cost:110,mat:8},
{id:'armory',name:'军械库',desc:'维护领主与部队的武装。',effect:'全队攻击、防御 +5% / 级',max:16,requires:2,cost:240,mat:12},
{id:'beastpen',name:'驯兽场',desc:'为招募怪物提供栖身之所。',effect:'怪物容量 +20 / 级；怪物属性 +12% / 级；威慑 +3 / 级',max:24,requires:2,cost:220,mat:12},
{id:'academy',name:'研习所',desc:'研究战术，拆解闲置装备。',effect:'解锁装备分解；领主洞察 +3、领袖 +2 / 级',max:16,requires:2,cost:260,mat:12},
{id:'warehouse',name:'仓库',desc:'储存装备和离线冒险收获。',effect:'装备容量 +60、离线上限 +1 小时 / 级',max:16,requires:1,cost:140,mat:9},
{id:'market',name:'商栈',desc:'出售材料，扩大赏金收益。',effect:'金币收益 +5%、贪婪 +3 / 级',max:16,requires:2,cost:220,mat:10},
{id:'altar',name:'领主祭坛',desc:'消耗金币和材料，强化领主自身。',effect:'领主自身基础与装备属性 +12% / 级；吸血 +0.3% / 级',max:16,requires:3,cost:350,mat:15}
];
const QUALITY=['普通','精良','大师','传说','至宝'];
const QUALITY_MULT=[1,1.4,2.1,3.2,5];
