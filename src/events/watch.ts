import { yellow, red, green, blue, underline, unstyle } from "ansi-colors"
import { db } from "../dbConnection"
import { Config, sendWebhookMessage, StationData } from "../util"

db.collection<StationData>("stations")
	.watch([], { fullDocumentBeforeChange: "whenAvailable" })
	.on("change", async change => {
		if (change.operationType !== "update") return
		const fullDocument = (await db.collection<StationData>("stations").findOne({ _id: change.documentKey._id }))!,
			config = (await db.collection<Config>("config").findOne({ name: "config" }))!,
			isFavourite = config.favouriteStations.includes(fullDocument.id)
		for (const [updatedKey, updatedValue] of Object.entries(change.updateDescription!.updatedFields!)) {
			if (["updatedAt", "bikePercentage"].includes(updatedKey)) continue
			const oldValue = change.fullDocumentBeforeChange?.[updatedKey as keyof StationData]
			if (oldValue)
				console.log(
					(isFavourite ? underline : process.env.NODE_ENV === "production" ? unstyle : (s: string) => s)(
						`Property ${yellow(updatedKey)} changed from ${red(`${oldValue}`)} to ${green(`${updatedValue}`)} on station ${blue(
							`${fullDocument.id}`
						)}`
					)
				)
			else
				console.log(
					(isFavourite ? underline : process.env.NODE_ENV === "production" ? unstyle : (s: string) => s)(
						`Property ${yellow(updatedKey)} updated to ${green(`${updatedValue}`)} on station ${blue(`${fullDocument.id}`)}`
					)
				)
			if (
				config.favouriteProps.includes(updatedKey as keyof StationData) ||
				isFavourite ||
				(config.toBeReleased.includes(fullDocument.id) && change.fullDocumentBeforeChange?.status === "repair")
			)
				await sendWebhookMessage({
					content: `${keysToStrings[updatedKey as keyof typeof keysToStrings]} da estação ${
						fullDocument.id
					} passou de __${oldValue}__ para **${updatedValue}** ${getEmojiForChange(updatedValue, oldValue)}`,
				})
		}
	})

type ValueOf<T> = T[keyof T]

function getEmojiForChange<T extends ValueOf<StationData>>(updatedValue: T, oldValue?: T) {
	switch (typeof oldValue) {
		case "string": {
			if (updatedValue === "active") return "✅"
			else return "⚒️"
		}
		case "number": {
			if (updatedValue > (oldValue ?? 0)) return "✅"
			else return "❌"
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
