import { readdirSync, statSync } from "node:fs"
import { resolve } from "node:path"
import { client } from "../index"
import { type ChatInputApplicationCommandData, type ChatInputCommandInteraction } from "discord.js"

export default function loadBot() {
	// Load listeners
	readdirSync("./dist/listeners")
		.filter(l => l.endsWith(".js"))
		.forEach(listener => require(`../listeners/${listener}`))

	// Load commands
	readdirDeep("./dist/commands").forEach(path => {
		const command: Command = require(path)?.default
		if (!command) return

		client.commands.set(command.name, command)
	})
}

// Read all js files in a directory to allow nested folders
function readdirDeep(dir: string): string[] {
	const files = readdirSync(dir),
		result = []
	for (const file of files) {
		const path = resolve(dir, file),
			stat = statSync(path)
		if (stat.isDirectory()) result.push(...readdirDeep(path))
		else if (stat.isFile() && file.endsWith(".js")) result.push(path)
	}
	return result
}

export interface Command extends ChatInputApplicationCommandData {
	devOnly?: boolean
	execute(interaction: ChatInputCommandInteraction): Promise<void>
}
