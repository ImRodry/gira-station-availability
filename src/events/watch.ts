import { yellow, red, green, blue, underline } from "ansi-colors"
import { db } from "../dbConnection"
import { Config, crosspost, sendWebhookMessage, StationData } from "../util"

db.collection<StationData>("stations")
	.watch([], { fullDocumentBeforeChange: "whenAvailable" })
	.on("change", async change => {
		if (change.operationType === "insert") {
			const message = await sendWebhookMessage({
				content: `🎉 **NOVA ESTAÇÃO EM TESTES!** 🎉\nA estação __${change.fullDocument.name}__ foi adicionada ao sistema no estado _${change.fullDocument.status}_ e com **${change.fullDocument.numDocks}** docas. A estação encontra-se nas coordenadas \`${change.fullDocument.coordinates[1]}, ${change.fullDocument.coordinates[0]}\`.`,
			}).then(r => r.json() as Promise<Message>)
			await crosspost(message.channel_id, message.id)
		}
		if (change.operationType !== "update") return
		const fullDocument = (await db.collection<StationData>("stations").findOne({ _id: change.documentKey._id }))!,
			config = (await db.collection<Config>("config").findOne({ name: "config" }))!,
			isFavouriteStation = config.favouriteStations.includes(fullDocument.id)
		for (const [updatedKey, updatedValue] of Object.entries(change.updateDescription!.updatedFields!)) {
			if (["updatedAt", "bikePercentage"].includes(updatedKey)) continue
			const oldValue = change.fullDocumentBeforeChange?.[updatedKey as keyof StationData]
			if (oldValue)
				console.log(
					(isFavouriteStation ? underline : (s: string) => s)(
						`Property ${yellow(updatedKey)} changed from ${red(`${oldValue}`)} to ${green(`${updatedValue}`)} on station ${blue(
							`${fullDocument.id}`
						)}`
					)
				)
			else
				console.log(
					(isFavouriteStation ? underline : (s: string) => s)(
						`Property ${yellow(updatedKey)} updated to ${green(`${updatedValue}`)} on station ${blue(`${fullDocument.id}`)}`
					)
				)
			if (
				config.favouriteProps.includes(updatedKey as keyof StationData) ||
				isFavouriteStation ||
				(config.toBeReleased.includes(fullDocument.id) && change.fullDocumentBeforeChange?.status === "repair")
			) {
				const message = await sendWebhookMessage({
					content: `${getEmojiForChange(updatedValue, oldValue)} ${keysToStrings[updatedKey as keyof typeof keysToStrings]} da estação __${
						fullDocument.name
					}__ passou de _${oldValue}_ para **${updatedValue}** ${
						config.toBeReleased.includes(fullDocument.id) && updatedValue === "active" ? "🎉 **NOVA ESTAÇÃO** 🎉" : ""
					}`,
				}).then(res => res.json() as Promise<Message>)

				if (config.favouriteProps.includes(updatedKey as keyof StationData)) await crosspost(message.channel_id, message.id)
			}
		}
	})

type ValueOf<T> = T[keyof T]

function getEmojiForChange<T extends ValueOf<StationData>>(updatedValue: T, oldValue?: T) {
	switch (typeof updatedValue) {
		case "string": {
			if (updatedValue === "active") return "✅"
			else return "⚒️"
		}
		case "number": {
			if (updatedValue > (oldValue ?? 0)) return "📈"
			else return "📉"
		}
		default:
			return "❓"
	}
}

const keysToStrings: Record<keyof Omit<StationData, "updatedAt" | "bikePercentage">, string> = {
	id: "O ID",
	coordinates: "As coordenadas",
	name: "O nome",
	numBikes: "O número de bicicletas",
	numDocks: "O número de docas",
	status: "O estado",
}

interface Message {
	id: string
	type: number
	content: string
	channel_id: string
	author: {
		bot: boolean
		id: string
		username: string
		avatar: string
		discriminator: string
	}
	attachments: never[]
	embeds: never[]
	mentions: never[]
	mention_roles: never[]
	pinned: boolean
	mention_everyone: boolean
	tts: boolean
	timestamp: string
	edited_timestamp: string | null
	flags: number
	components: never[]
	webhook_id: string
}
