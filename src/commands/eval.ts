const fs = require("node:fs"),
	{ ids, color } = require("../config.json"),
	util = require("../lib/util"),
	{ mongoClient } = require("../lib/dbConnection")

import { inspect } from "node:util"
import discord from "discord.js"
import { transpile, getParsedCommandLineOfConfigFile, sys } from "typescript"
import { db as mongoDb } from "../lib/dbConnection"
import type { Command } from "../lib/imports"

const command: Command = {
	name: "eval",
	description: "Evaluates the specified code",
	options: [
		{
			type: discord.ApplicationCommandOptionType.String,
			name: "code",
			description: "The code to run",
			required: true,
		},
	],
	devOnly: true,
	defaultMemberPermissions: 8n,
	async execute(interaction) {
		if (!interaction.inCachedGuild()) return
		const { channel, client, guild, member: me } = interaction,
			Discord = discord,
			db = mongoDb

		await interaction.deferReply({ ephemeral: true })
		let evaled,
			codeToRun = interaction.options.getString("code", true).replaceAll(/[“”]/gim, '"')
		if (codeToRun.includes("await ")) codeToRun = `(async () => {\n${codeToRun}\n})()`

		// This is stupid - https://github.com/microsoft/TypeScript/issues/45856
		const { options } = getParsedCommandLineOfConfigFile(
			"tsconfig.json",
			{},
			{
				...sys,
				onUnRecoverableConfigFileDiagnostic: console.error,
			}
		)!
		// Minimize the output
		options.sourceMap = false
		options.alwaysStrict = false

		const compiledCode = transpile(codeToRun, options)
		try {
			evaled = await eval(compiledCode)
			const inspected = inspect(evaled, { depth: 1, getters: true }),
				embed = new discord.EmbedBuilder({
					color: discord.Colors.DarkGreen,
					author: { name: "Evaluation" },
					title: "The code was executed successfully! Here's the output",
					fields: [
						{ name: "Input", value: discord.codeBlock("ts", codeToRun.substring(0, 1014)) },
						{
							name: "Compiled code",
							value: discord.codeBlock("js", compiledCode.replaceAll(";", "").substring(0, 1014)),
						},
						{ name: "Output", value: discord.codeBlock("js", inspected.substring(0, 1014)) },

						{
							name: "Output type",
							value:
								evaled?.constructor?.name === "Array"
									? `${evaled.constructor.name}<${evaled[0]?.constructor.name}>`
									: evaled?.constructor?.name ?? typeof evaled,
							inline: true,
						},
						{ name: "Output length", value: `${inspected.length}`, inline: true },
						{
							name: "Time taken",
							value: `${(Date.now() - interaction.createdTimestamp).toLocaleString()}ms`,
							inline: true,
						},
					],
				})
			await interaction.editReply({ embeds: [embed] })
			console.log(evaled)
		} catch (error) {
			const embed = new discord.EmbedBuilder({
				color: discord.Colors.DarkRed,
				author: { name: "Evaluation" },
				title: "An error occured while executing that code. Here's the error stack",
				fields: [
					{ name: "Input", value: discord.codeBlock("ts", codeToRun.substring(0, 1014)) },
					{
						name: "Compiled code",
						value: discord.codeBlock("js", compiledCode.replaceAll(";", "").substring(0, 1014)),
					},
					{ name: "Error", value: discord.codeBlock((error.stack ?? inspect(error)).substring(0, 1016)) },

					{ name: "Error Type", value: error.name ?? "Custom", inline: true },
					{ name: "Error length", value: `${(error.stack ?? inspect(error)).length}`, inline: true },
					{
						name: "Time taken",
						value: `${(Date.now() - interaction.createdTimestamp).toLocaleString()}ms`,
						inline: true,
					},
				],
			})
			console.error(error)
			await interaction.editReply({ embeds: [embed] })
		}
	},
}

export default command
