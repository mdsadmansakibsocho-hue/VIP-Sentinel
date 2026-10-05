# 𝗩ɪᴘ 𝐂ᴏᴍᴍᴜɴɪᴛʏ ( ᴏғғɪᴄɪᴀʟ ) — Premium Security

## Setup
1. Rename `.env.example` to `.env`.
2. Put your Discord Bot Token and your Discord User ID in `.env`.
3. Open terminal in this folder.
4. Run `npm install`
5. Run `npm start`

## Main commands
/security
/security-config
/lockdown
/unlockdown
/whitelist add @user
/whitelist remove @user
/whitelist list
/setup-logs

## Important
Enable the required Gateway Intents in Discord Developer Portal:
- Server Members Intent
- Message Content Intent

Invite the bot with Administrator permission for full protection. Never share your bot token.
Test in a private server first.


Default automatic punishment is a 2-hour Discord timeout. Change PUNISHMENT=kick or PUNISHMENT=ban only if you intentionally want those actions.
