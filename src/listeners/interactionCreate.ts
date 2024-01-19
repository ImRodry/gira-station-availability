import { client } from "../index"
import { ids } from "../config.json"
import { MetroResponse, MetroStationData, makeMetroRequest } from "../lib/util"

let metroStations: MetroResponse<MetroStationData[]> & { lastUpdated: number }

client.on("interactionCreate", async interaction => {
	if (interaction.isAutocomplete()) {
		const option = interaction.options.getFocused(true)
		if (interaction.commandName === "metro" && option.name === "nome" && interaction.options.getSubcommand() == "estação") {
			if (!metroStations || metroStations.lastUpdated + 60 * 60_000 < Date.now()) {
				const data = await makeMetroRequest<MetroStationData[]>("infoEstacao/todos")
				if (data) metroStations = { ...data, lastUpdated: Date.now() }
				else
					await interaction.respond([
						{ name: "Não foi possível encontrar a lista de estações. Por favor, tenta novamente mais tarde", value: "erro" },
					])
			}
			const exactMatch = metroStations.resposta.find(
				s => s.stop_name.toLowerCase() === option.value.toLowerCase() || s.stop_id === option.value.toUpperCase()
			)
			await interaction.respond(
				exactMatch
					? [{ name: exactMatch.stop_name, value: exactMatch.stop_id }]
					: metroStations.resposta
							.filter(
								s => s.stop_name.toLowerCase().startsWith(option.value.toLowerCase()) || s.stop_id.startsWith(option.value.toUpperCase())
							)
							.map(s => ({ name: s.stop_name, value: s.stop_id }))
							.slice(0, 25)
			)
		}
	}
	if (interaction.isChatInputCommand()) {
		const command = client.commands.get(interaction.commandName)

		if (!command) return void (await interaction.reply({ content: "Couldn't find that command", ephemeral: true }))

		if (command.devOnly && interaction.user.id !== ids.users.dev)
			return void (await interaction.reply({
				content:
					"```\n _____________________________________ \n/ I am a cow and even I know that not \\\n everyone gets access to eval        /\n ------------------------------------- \n        \\   ^__^\n         \\  (oo)\\_______\n            (__)\\       )\\/\\\n                ||----w |\n                ||     ||\n```",
				ephemeral: true,
			}))

		try {
			await command.execute(interaction)
		} catch (error) {
			console.error(error)
		}
	}
})
