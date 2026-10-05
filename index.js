const {Client,GatewayIntentBits,Partials,Events,PermissionFlagsBits,ChannelType,EmbedBuilder}=require("discord.js");
const config=require("./config"),store=require("./store"),security=require("./security"),logger=require("./logger");
if(!config.token){console.error("DISCORD_TOKEN missing in .env");process.exit(1);}
const client=new Client({intents:[
 GatewayIntentBits.Guilds,GatewayIntentBits.GuildMembers,GatewayIntentBits.GuildMessages,
 GatewayIntentBits.MessageContent,GatewayIntentBits.GuildModeration
],partials:[Partials.GuildMember,Partials.User,Partials.Channel]});

const commands=[
{name:"security",description:"Show complete security status"},
{name:"security-config",description:"Show current security configuration"},
{name:"setup-logs",description:"Create the premium security log channel"},
{name:"lockdown",description:"Emergency lock all text channels"},
{name:"unlockdown",description:"Release emergency lockdown"},
{name:"whitelist",description:"Manage trusted users",options:[
{name:"action",description:"add/remove/list",type:3,required:true,choices:[{name:"add",value:"add"},{name:"remove",value:"remove"},{name:"list",value:"list"}]},
{name:"user",description:"User for add/remove",type:6,required:false}
]},
];

client.once(Events.ClientReady,async c=>{
 console.log("🛡️ "+c.user.tag+" ONLINE");
 for(const g of c.guilds.cache.values()) await g.commands.set(commands).catch(()=>{});
});

async function emergency(g,reason){
 const did=await security.lockdown(g);
 if(did) await logger.log(g,"🚨 EMERGENCY LOCKDOWN",reason);
}

client.on(Events.GuildMemberAdd,async m=>{
 if(security.trusted(m.guild,m.id))return;
 const raid=security.joinBurst(m.guild);
 await logger.log(m.guild,"👤 MEMBER JOIN",`${m.user.tag} joined.`);
 if(raid&&config.autoLockdown) await emergency(m.guild,`Raid threshold reached: ${config.raidThreshold} joins in ${config.raidWindow}s.`);
});

client.on(Events.GuildMemberRemove,async m=>{
 await logger.log(m.guild,"👋 MEMBER LEFT",`${m.user?.tag||"Unknown"} left the server.`);
});

client.on(Events.MessageCreate,async msg=>{
 if(!msg.guild||msg.author.bot)return;
 if(security.trusted(msg.guild,msg.author.id))return;
 if(/discord\.gg\/|discord\.com\/invite\//i.test(msg.content)){
   await msg.delete().catch(()=>{});
   await logger.log(msg.guild,"🔗 INVITE BLOCKED",`${msg.author.tag} posted an invite.`);
 }
});

client.on(Events.GuildAuditLogEntryCreate,async(entry,guild)=>{
 const executor=entry.executor;
 if(!executor||executor.bot||security.trusted(guild,executor.id))return;
 const dangerous=[
  10, // CHANNEL_CREATE
  11, // CHANNEL_DELETE
  12, // CHANNEL_UPDATE
  30, // MEMBER_ROLE_UPDATE
  31, // MEMBER_MOVE
  32, // MEMBER_DISCONNECT
  20, // ROLE_CREATE
  21, // ROLE_DELETE
  22, // ROLE_UPDATE
  24, // MEMBER_BAN_ADD
  25  // MEMBER_BAN_REMOVE
 ];
 if(!dangerous.includes(entry.action))return;
 const burst=security.actionBurst(guild,executor.id);
 await logger.log(guild,"⚠️ SECURITY EVENT",`Suspicious audit-log activity detected from **${executor.tag}**.`,[
  {name:"Action",value:String(entry.action),inline:true},
  {name:"Executor",value:executor.tag,inline:true},
  {name:"Burst",value:burst?"THRESHOLD REACHED":"Normal",inline:true}
 ]);
 if(burst&&config.autoLockdown) await emergency(guild,`Repeated dangerous audit-log actions by ${executor.tag}.`);
 const member=await guild.members.fetch(executor.id).catch(()=>null);
 if(burst&&config.autoPunish&&member&&!security.trusted(guild,executor.id)){
   await security.punish(member,"VIP Security: suspicious destructive activity");
   await logger.log(guild,"🔨 SECURITY PUNISHMENT",`${executor.tag} was automatically ${config.punishment}ed after suspicious activity.`);
 }
});

client.on(Events.ChannelDelete,async channel=>{
 const g=channel.guild;if(!g)return;
 await logger.log(g,"🗑️ CHANNEL DELETED",`Channel **${channel.name}** was deleted.`);
});
client.on(Events.RoleDelete,async role=>{
 await logger.log(role.guild,"🎭 ROLE DELETED",`Role **${role.name}** was deleted.`);
});

client.on(Events.InteractionCreate,async i=>{
 if(!i.isChatInputCommand()||!i.guild)return;
 const g=i.guild, me=i.member;
 const admin=me.permissions?.has(PermissionFlagsBits.Administrator);
 if(!admin&&!security.trusted(g,i.user.id))return i.reply({content:"❌ Administrator permission required.",flags:64});

 try{
  await i.deferReply({flags:64});
  if(i.commandName==="security"){
   const s=store.guild(g.id);
   const e=new EmbedBuilder().setTitle("🛡️ VIP COMMUNITY SECURITY").setDescription("Premium protection system is active.")
   .addFields(
    {name:"🟢 System",value:"ONLINE",inline:true},{name:"🛡️ Anti-Raid",value:"ON",inline:true},
    {name:"💣 Anti-Nuke Monitor",value:"ON",inline:true},{name:"🔗 Invite Guard",value:"ON",inline:true},
    {name:"🔒 Lockdown",value:s.locked?"ACTIVE":"Ready",inline:true},{name:"👥 Whitelist",value:String(s.whitelist.length),inline:true}
   ).setFooter({text:"𝗩ɪᴘ 𝐂ᴏᴍᴍᴜɴɪᴛʏ ( ᴏғғɪᴄɪᴀʟ )"}).setTimestamp();
   return i.editReply({embeds:[e]});
  }
  if(i.commandName==="security-config")return i.editReply({content:
`🛡️ **Security Configuration**\nRaid: ${config.raidThreshold}/${config.raidWindow}s\nDangerous actions: ${config.actionThreshold}/${config.actionWindow}s\nAuto-lockdown: ${config.autoLockdown?"ON":"OFF"}\nAuto-punishment: ${config.autoPunish?"ON":"OFF"}\nPunishment: ${config.punishment}`});
  if(i.commandName==="setup-logs"){const c=await logger.channel(g);return i.editReply({content:c?`✅ Logs: ${c}`:"❌ Could not create log channel."});}
  if(i.commandName==="lockdown"){await security.lockdown(g);await logger.log(g,"🔒 MANUAL LOCKDOWN",`Started by ${i.user.tag}`);return i.editReply("🔒 **Emergency lockdown activated.**");}
  if(i.commandName==="unlockdown"){await security.unlock(g);await logger.log(g,"🔓 LOCKDOWN RELEASED",`Released by ${i.user.tag}`);return i.editReply("🔓 **Lockdown released.**");}
  if(i.commandName==="whitelist"){
   const a=i.options.getString("action"),u=i.options.getUser("user"),s=store.guild(g.id);
   if(a==="list")return i.editReply({content:"👥 Trusted users: "+(s.whitelist.map(x=>`<@${x}>`).join(", ")||"None")});
   if(!u)return i.editReply({content:"❌ Select a user."});
   if(a==="add"&&!s.whitelist.includes(u.id))s.whitelist.push(u.id);
   if(a==="remove")s.whitelist=s.whitelist.filter(x=>x!==u.id);
   store.save(); await logger.log(g,"👥 WHITELIST UPDATED",`${u.tag} was ${a}ed by ${i.user.tag}.`);
   return i.editReply(`✅ ${u.tag} whitelist ${a} completed.`);
  }
 }catch(e){console.error(e);if(i.deferred) await i.editReply({content:"❌ Security operation failed. Check terminal."}); else if(!i.replied) await i.reply({content:"❌ Security operation failed. Check terminal.",flags:64});}
});

process.on("unhandledRejection",console.error);process.on("uncaughtException",console.error);
client.login(config.token);