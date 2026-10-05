const {ChannelType,EmbedBuilder}=require("discord.js");
const config=require("./config");
async function channel(guild){
 let c=guild.channels.cache.find(x=>x.type===ChannelType.GuildText&&x.name===config.logName);
 if(!c) try{c=await guild.channels.create({name:config.logName,type:ChannelType.GuildText,reason:"VIP Security log channel"});}catch{}
 return c;
}
async function log(guild,title,description,fields=[]){
 const c=await channel(guild); if(!c)return;
 const e=new EmbedBuilder().setTitle(title).setDescription(description).setTimestamp().addFields(fields.slice(0,25));
 await c.send({embeds:[e]}).catch(()=>{});
}
module.exports={channel,log};