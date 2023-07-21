import { ChatInputApplicationCommandData, ChatInputCommandInteraction, Client, Collection } from "discord.js"

export default class GiraClient extends Client<true> {
	commands = new Collection<string, Command>()
}

export interface Command extends ChatInputApplicationCommandData {
	global?: true
	execute(interaction: ChatInputCommandInteraction): Promise<void>
}
