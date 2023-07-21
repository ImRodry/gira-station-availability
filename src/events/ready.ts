import { client } from "../index"
import { ids } from "../config.json"

client.on("ready", async () => {
	console.log(`Logged in as ${client.user.tag}`)

	const guild = client.guilds.cache.get(ids.guild),
		[guildCommands, globalCommands] = client.commands.partition(c => !c.global)
})
