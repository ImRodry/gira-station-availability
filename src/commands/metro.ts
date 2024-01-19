import { ApplicationCommandOptionType, Colors, EmbedBuilder } from "discord.js"
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
						`estadoLinha/${line}`
					)

				if (!data)
					return void (await interaction.editReply(
						"Ocorreu um erro ao obter os estados das linhas. Se o erro persistir, por favor contacta o desenvolvedor."
					))
				const embed = new EmbedBuilder({
					title: "Estado das linhas",
					color: Object.entries(data.resposta)
						.filter(([k]) => !k.startsWith("tipo_msg"))
						.every(([, v]) => v === " Ok")
						? Colors.Green
						: Colors.Red,
					fields: [
						...("amarela" in data.resposta ? [{ name: "Linha Amarela", value: data.resposta.amarela }] : []),
						...("azul" in data.resposta ? [{ name: "Linha Azul", value: data.resposta.azul }] : []),
						...("verde" in data.resposta ? [{ name: "Linha Verde", value: data.resposta.verde }] : []),
						...("vermelha" in data.resposta ? [{ name: "Linha Vermelha", value: data.resposta.vermelha }] : []),
					],
				})

				await interaction.editReply({ embeds: [embed] })
				break
			}
			case "tempo": {
				const line = interaction.options.getString("linha", true) as keyof typeof lineColors,
					data = await makeMetroRequest<TempoEspera[] | string>(`tempoEspera/Linha/${line.toLowerCase()}`),
					infoEstacoes = await makeMetroRequest<MetroStationData[]>("infoEstacao/todos"),
					infoDestinos = await makeMetroRequest<Destino[]>("infoDestinos/todos")

				if (!data || !infoDestinos)
					return void (await interaction.editReply(
						"Ocorreu um erro ao obter os tempos da linha. Se o erro persistir, por favor contacta o desenvolvedor."
					))

				if (typeof data.resposta === "string")
					return void (await interaction.editReply({ embeds: [{ title: "Erro", description: data.resposta }] }))
				// TODO replace with Object.groupBy in node v22
				const timeByStation = data.resposta.reduce((acc, curr) => {
						acc[curr.stop_id] ??= []
						const newLength = acc[curr.stop_id].push(curr)
						if (newLength === 2) acc[curr.stop_id].sort((a, b) => Number(a.destino) - Number(b.destino))
						return acc
					}, {} as Record<string, TempoEspera[]>),
					embed = new EmbedBuilder({
						title: `Tempos de espera da Linha ${line}`,
						color: lineColors[line],
						fields: Object.entries(timeByStation).map(([station, times]) => ({
							name: `${infoEstacoes?.resposta.find(s => s.stop_id === station)?.stop_name ?? `Estação desconhecida (${station})`}`,
							value: times
								.map(
									x =>
										`Destino: **${
											infoDestinos.resposta.find(d => d.id_destino === x.destino)?.nome_destino ?? `Destino desconhecido (${x.destino})`
										}**\nTempos:\n${Array(3)
											.fill(0)
											// todo filter out duplicated times (turn into array?)
											.map((_, i) => `Comboio ${i + 1}: ${parseSeconds(x[`tempoChegada${(i + 1) as 1 | 2 | 3}`])}`)
											.join("\n")}`
								)
								.join("\n\n"),
							inline: true,
						})),
					})

				await interaction.editReply({ embeds: [embed] })
				break
			}
		}
	},
}

function parseSeconds(seconds: string | number) {
	seconds = Number(seconds)
	return `${Math.floor(seconds / 60)}m${seconds % 60}s`
}

// function parseMadeUpArray<T extends Record<string, unknown>, K extends string[]>(obj: T, keys: K) {
// 	const entries = Object.entries(obj),
// 		newObj = Object.fromEntries(entries.filter(([k]) => !keys.some(key => k.startsWith(key)))) as Partial<TransformKeys<T, K>>

// 	for (const key of keys) {
// 		const values = entries
// 			.filter(([k]) => k.startsWith(key as string))
// 			.sort(([a], [b]) => a.localeCompare(b))
// 			.map(([, v]) => v)
// 		if (values.length) newObj[key as keyof T] = values
// 	}
// 	return newObj
// }

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

interface TempoEspera {
	stop_id: string
	cais: string
	hora: string
	comboio: string
	tempoChegada1: string
	comboio2: string
	tempoChegada2: string
	comboio3: string
	tempoChegada3: string
	destino: string
	sairServico: string
}

type TransformKeys<T, K extends string> = {
	[P in keyof T as P extends `${K}${infer R}` ? (R extends `${number}` ? `${K}` : P) : P]: P extends `${K}${infer R}` ? T[P][] : T[P]
}

// Usage:
type NewTempoEspera = TransformKeys<TempoEspera, "combedgrtoio" | "tempoChegada">

interface Destino {
	id_destino: string
	nome_destino: string
}
