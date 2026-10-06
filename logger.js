const { ChannelType, EmbedBuilder } = require("discord.js");
const config = require("./config");

async function channel(guild) {
  let c = guild.channels.cache.find(
    x => x.type === ChannelType.GuildText && x.name === config.logName
  );

  if (!c) {
    try {
      c = await guild.channels.create({
        name: config.logName,
        type: ChannelType.GuildText,
        reason: "VIP Security log channel"
      });
    } catch {}
  }

  return c;
}

async function log(guild, title, description, fields = []) {
  const c = await channel(guild);
  if (!c) return;

  const safeFields = fields
    .slice(0, 25)
    .filter(field => field && field.name != null)
    .map(field => ({
      name: String(field.name),
      value: String(field.value ?? "N/A"),
      inline: Boolean(field.inline)
    }));

  const e = new EmbedBuilder()
    .setTitle(String(title ?? "Log"))
    .setDescription(String(description ?? "No description"))
    .setTimestamp();

  if (safeFields.length > 0) {
    e.addFields(safeFields);
  }

  await c.send({ embeds: [e] }).catch(() => {});
}

module.exports = { channel, log };
