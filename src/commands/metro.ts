import { ApplicationCommandOptionType } from "discord.js"
import { Command } from "../lib/GiraClient"

const command: Command = {
	name: "metro",
	description: "Obtém informações sobre o Metro de Lisboa",
	options: [
		{
			type: ApplicationCommandOptionType.SubcommandGroup,
			name: "tempos",
			description: "Mostra os tempos de espera de uma estação ou linha",
			options: [
				{
					type: ApplicationCommandOptionType.Subcommand,
					name: "estação",
					description: "Mostra os tempos de espera de uma estação",
					options: [
						{
							type: ApplicationCommandOptionType.String,
							name: "estação",
							description: "Nome da estação",
							required: true,
							autocomplete: true,
						},
					],
				},
				{
					type: ApplicationCommandOptionType.Subcommand,
					name: "linha",
					description: "Mostra os tempos de espera de uma linha",
					options: [
						{
							type: ApplicationCommandOptionType.String,
							name: "linha",
							description: "Nome da linha",
							required: true,
							choices: [
								{ name: "Linha Amarela", value: "Amarela" },
								{ name: "Linha Azul", value: "Azul" },
								{ name: "Linha Verde", value: "Verde" },
								{ name: "Linha Vermelha", value: "Vermelha" },
							],
						},
					],
				},
			],
		},
		{
			type: ApplicationCommandOptionType.Subcommand,
			name: "estação",
			description: "Obtém informações sobre uma estação",
			options: [
				{
					type: ApplicationCommandOptionType.String,
					name: "estação",
					description: "Nome da estação",
					required: true,
					autocomplete: true,
				},
			],
		},
		{
			type: ApplicationCommandOptionType.Subcommand,
			name: "estado",
			description: "Obtém o estado atual de uma ou todas as linhas",
			options: [
				{
					type: ApplicationCommandOptionType.String,
					name: "linha",
					description: "Nome da linha",
					choices: [
						{ name: "Linha Amarela", value: "Amarela" },
						{ name: "Linha Azul", value: "Azul" },
						{ name: "Linha Verde", value: "Verde" },
						{ name: "Linha Vermelha", value: "Vermelha" },
						{ name: "Todas", value: "todos" },
					],
					required: true,
				},
			],
		},
		{
			type: ApplicationCommandOptionType.Subcommand,
			name: "tempo",
			description: "Obtém o tempo de espera de uma linha",
			options: [
				{
					type: ApplicationCommandOptionType.String,
					name: "linha",
					description: "Nome da linha",
					choices: [
						{ name: "Linha Amarela", value: "Amarela" },
						{ name: "Linha Azul", value: "Azul" },
						{ name: "Linha Verde", value: "Verde" },
						{ name: "Linha Vermelha", value: "Vermelha" },
					],
					required: true,
				},
			],
		},
		{
			type: ApplicationCommandOptionType.Subcommand,
			name: "destinos",
			description: "Obtém os destinos possíveis do metro",
		},
		{
			type: ApplicationCommandOptionType.Subcommand,
			name: "intervalos",
			description: "Obtém os intervalos previstos entre comboios",
			options: [
				{
					type: ApplicationCommandOptionType.String,
					name: "linha",
					description: "Nome da linha",
					choices: [
						{ name: "Linha Amarela", value: "Amarela" },
						{ name: "Linha Azul", value: "Azul" },
						{ name: "Linha Verde", value: "Verde" },
						{ name: "Linha Vermelha", value: "Vermelha" },
					],
					required: true,
				},
				{
					type: ApplicationCommandOptionType.String,
					name: "dia",
					description: "Tipo de dia",
					choices: [
						{ name: "Dia de semana", value: "S" },
						{ name: "Fim de semana/Feriado", value: "F" },
					],
					required: true,
				},
				{
					type: ApplicationCommandOptionType.String,
					name: "hora",
					description: "Hora",
					required: true,
				},
				}
			],
		},
	],
	async execute(interaction) {},
}

export default command
