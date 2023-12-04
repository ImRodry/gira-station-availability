import { ApplicationCommandOptionType, EmbedBuilder } from "discord.js"
import { Command } from "../lib/imports"
import { MetroStationData, makeMetroRequest, parseMalformedArray } from "../lib/util"

const listFormatter = new Intl.ListFormat("pt")
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
					name: "nome",
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
					description: "Hora no formato hhmmss",
					required: true,
				},
			],
		},
	],
	async execute(interaction) {
		await interaction.deferReply({ ephemeral: true })
		const subcommand =
			interaction.options.getSubcommandGroup() ||
			(interaction.options.getSubcommand() as "tempos" | "estação" | "estado" | "tempo" | "destinos" | "intervalos")

		switch (subcommand) {
			case "tempos": {
				return void (await interaction.editReply("Serviço em manutenção"))
			}
			case "estação": {
				const nome = interaction.options.getString("nome", true)
				if (nome === "todos")
					return void (await interaction.editReply(
						"Este comando não suporta a exibição de todas as estações. Por favor, escolhe apenas uma"
					))
				const data = await makeMetroRequest<MetroStationData[] | string>(`infoEstacao/${nome}`)

				if (!data)
					return void (await interaction.editReply(
						"Ocorreu um erro ao obter os dados da estação. Se o erro persistir, por favor contacta o desenvolvedor."
					))

				if (typeof data.resposta === "string") return void (await interaction.editReply("Essa estação não existe!"))
				// We check if all stations were requested previously and return so it's safe to assume the array only has 1 element here
				const station = data.resposta[0],
					lines = parseMalformedArray(station.linha) as (keyof typeof lineColors)[],
					embed = new EmbedBuilder({
						color: lineColors[lines[0]],
						title: `${station.stop_name} (${station.stop_id})`,
						description: `A estação ${station.stop_name} do Metropolitano de Lisboa pertence ${
							lines.length === 1 ? "à linha" : "às linhas"
						} ${listFormatter.format(lines)}. Podes vê-la no Google Maps através deste [link](https://google.pt/maps/place/${
							station.stop_lat
						}+${station.stop_lon})`,
						fields: [
							{ name: `Linha${lines.length === 1 ? "" : "s"}`, value: listFormatter.format(lines), inline: true },
							{ name: "Coordenadas", value: `${station.stop_lat}, ${station.stop_lon}`, inline: true },
							{ name: "Zona", value: station.zone_id, inline: true },
							{ name: `Página${lines.length === 1 ? "" : "s"} da estação`, value: parseMalformedArray(station.stop_url).join("\n") },
						],
					})

				await interaction.editReply({ embeds: [embed] })
				break
			}
			case "estado": {
				const line = interaction.options.getString("linha", true) as keyof typeof lineColors | "todos",
					data = await makeMetroRequest<UnionOrIntersection<[YellowLineStatus, BlueLineStatus, GreenLineStatus, RedLineStatus]>>(
						`estadoLinhas/${line}`
					)

				if (!data)
					return void (await interaction.editReply(
						"Ocorreu um erro ao obter os estados das linhas. Se o erro persistir, por favor contacta o desenvolvedor."
					))
				const embed = new EmbedBuilder({})
			}
		}
	},
}

export default command

const lineColors = {
	Amarela: 0xfdb813,
	Azul: 0x4d85c5,
	Verde: 0x00a9a7,
	Vermelha: 0xee2375,
}

type UnionOfInterfaces<T extends any[]> = T extends [infer Head, ...infer Rest] ? Head & UnionOfInterfaces<Rest> : unknown

type UnionOrIntersection<T extends any[]> = UnionOfInterfaces<T> | T[number]

interface YellowLineStatus {
	amarela: string
	tipo_msg_am: string
}

interface BlueLineStatus {
	azul: string
	tipo_msg_az: string
}

interface GreenLineStatus {
	verde: string
	tipo_msg_vd: string
}

interface RedLineStatus {
	vermelha: string
	tipo_msg_vm: string
}
