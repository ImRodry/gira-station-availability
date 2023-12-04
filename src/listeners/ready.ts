import { client } from "../index"

client.on("ready", async () => {
	console.log(`Logged in as ${client.user.tag}!`)

	const guild = client.guilds.cache.get("440838503560118273")!,
		[guildCommands, globalCommands] = client.commands.partition(c => c.devOnly)

	// Replace all old guild commands since those have no delay
	await client.application.commands.set([...globalCommands.values()])
	await guild.commands.set([...guildCommands.values()])
	console.log("Updated all commands")
})
