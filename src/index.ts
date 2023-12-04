if (process.env.NODE_ENV !== "production") require("dotenv").config()
require("./lib/dbConnection")
import { Client, Collection, IntentsBitField } from "discord.js"
import loadBot, { Command } from "./lib/imports"

if (!process.env.GIRA_API_KEY) {
	console.log("No API key provided. Please set the GIRA_API_KEY environment variable.")
	process.exit(1)
}

export default class GiraClient extends Client<true> {
	commands = new Collection<string, Command>()
}

export const client = new GiraClient({ intents: [IntentsBitField.Flags.Guilds] })

loadBot()

client.login()
