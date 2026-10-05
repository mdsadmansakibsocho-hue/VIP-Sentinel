const {PermissionFlagsBits,ChannelType}=require("discord.js");
const config=require("./config"), store=require("./store");
const joins=new Map(), actions=new Map();

function trusted(guild,id){return id===config.ownerId||store.guild(guild.id).whitelist.includes(id)||config.trusted.includes(id);}
function burst(map,key,window,threshold){
 const now=Date.now(), a=(map.get(key)||[]).filter(t=>now-t<window*1000); a.push(now); map.set(key,a); return a.length>=threshold;
}
async function lockdown(guild){
 const s=store.guild(guild.id); if(s.locked)return false;
 for(const c of guild.channels.cache.values()) if(c.type===ChannelType.GuildText){
   await c.permissionOverwrites.edit(guild.roles.everyone,{SendMessages:false},{reason:"VIP Security emergency lockdown"}).catch(()=>{});
 }
 s.locked=true; store.save(); return true;
}
async function unlock(guild){
 const s=store.guild(guild.id); if(!s.locked)return false;
 for(const c of guild.channels.cache.values()) if(c.type===ChannelType.GuildText)
   await c.permissionOverwrites.edit(guild.roles.everyone,{SendMessages:null},{reason:"VIP Security lockdown released"}).catch(()=>{});
 s.locked=false; store.save(); return true;
}
async function punish(member,reason){
 if(!member)return false;

 if(config.punishment==="timeout"){
   if(!member.moderatable)return false;
   await member.timeout(2 * 60 * 60 * 1000, reason).catch(()=>{});
   return true;
 }

 if(config.punishment==="kick"){
   if(!member.kickable)return false;
   await member.kick(reason).catch(()=>{});
   return true;
 }

 if(config.punishment==="ban"){
   if(!member.bannable)return false;
   await member.ban({reason,deleteMessageSeconds:0}).catch(()=>{});
   return true;
 }

 return false;
}
module.exports={trusted,joinBurst:(g)=>burst(joins,g.id,config.raidWindow,config.raidThreshold),actionBurst:(g,u)=>burst(actions,g.id+":"+u,config.actionWindow,config.actionThreshold),lockdown,unlock,punish};