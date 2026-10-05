const fs=require("fs");
const path=require("path");
const file=path.join(__dirname,"..","data.json");
let db={guilds:{}};
try{if(fs.existsSync(file)) db=JSON.parse(fs.readFileSync(file,"utf8"));}catch{}
function guild(id){if(!db.guilds[id]) db.guilds[id]={whitelist:[],protectedRoles:[],protectedChannels:[],locked:false}; return db.guilds[id];}
function save(){fs.writeFileSync(file,JSON.stringify(db,null,2));}
module.exports={guild,save};