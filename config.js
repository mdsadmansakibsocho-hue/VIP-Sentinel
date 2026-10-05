require("dotenv").config();
const list=v=>(v||"").split(",").map(x=>x.trim()).filter(Boolean);
module.exports={
 token:process.env.DISCORD_TOKEN,
 ownerId:process.env.OWNER_ID,
 trusted:list(process.env.TRUSTED_USER_IDS),
 raidThreshold:+(process.env.RAID_JOIN_THRESHOLD||6),
 raidWindow:+(process.env.RAID_JOIN_WINDOW_SECONDS||10),
 actionThreshold:+(process.env.ACTION_THRESHOLD||4),
 actionWindow:+(process.env.ACTION_WINDOW_SECONDS||8),
 autoLockdown:(process.env.AUTO_LOCKDOWN||"true").toLowerCase()==="true",
 autoPunish:(process.env.AUTO_PUNISH||"true").toLowerCase()==="true",
 punishment:(process.env.PUNISHMENT||"timeout").toLowerCase(),
 logName:process.env.LOG_CHANNEL_NAME||"vip-security-logs"
};