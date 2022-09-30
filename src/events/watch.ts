import { yellow, red, green, blue, underline } from "ansi-colors"
import { favouriteStations, favouriteProps, toBeReleased } from "../config.json"
import { db } from "../dbConnection"
import { sendWebhookMessage, StationData } from "../util"

db.collection<StationData>("stations")
	.watch([], { fullDocumentBeforeChange: "whenAvailable" })
	.on("change", async change => {
		if (change.operationType !== "update") return
		const fullDocument = (await db.collection<StationData>("stations").findOne({ _id: change.documentKey._id }))!,
			isFavourite = favouriteStations.includes(fullDocument.id)
		for (const [updatedKey, updatedValue] of Object.entries(change.updateDescription!.updatedFields!)) {
			if (updatedKey === "updatedAt") continue
			if (change.fullDocumentBeforeChange?.[updatedKey as keyof StationData])
				console.log(
					(isFavourite ? underline : (s: string) => s)(
						`Property ${yellow(updatedKey)} changed from ${red(
							`${change.fullDocumentBeforeChange[updatedKey as keyof StationData]}`
						)} to ${green(`${updatedValue}`)} on station ${blue(`${fullDocument.id}`)}`
					)
				)
			else console.log(`Property ${yellow(updatedKey)} updated to ${green(`${updatedValue}`)} on station ${blue(`${fullDocument.id}`)}`)
			if (
				favouriteProps.includes(updatedKey) ||
				isFavourite ||
				(toBeReleased.includes(fullDocument.id) && change.fullDocumentBeforeChange?.status === "repair")
			)
				await sendWebhookMessage({
					content: `${keysToStrings[updatedKey as keyof typeof keysToStrings]} da estação ${fullDocument.id} passou de __${
						change.fullDocumentBeforeChange?.[updatedKey as keyof StationData]
					}__ para **${updatedValue}**`,
				})
		}
	})

const keysToStrings: Record<keyof Omit<StationData, "updatedAt">, string> = {
	id: "O ID",
	coordinates: "As coordenadas",
	name: "O nome",
	numBikes: "O número de bicicletas",
	numDocks: "O número de docas",
	bikePercentage: "A percentagem de bicicletas",
	status: "O estado",
}
