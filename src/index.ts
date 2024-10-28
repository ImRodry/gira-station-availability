if (process.env.NODE_ENV !== "production") require("dotenv").config()
require("./dbConnection")
import { readdirSync } from "node:fs"
import { db } from "./dbConnection"
import { Config, GiraListStationsResponse, StationData } from "./util"

readdirSync("./dist/events")
	.filter(path => path.endsWith(".js"))
	.forEach(file => require(`./events/${file}`))

export async function main(): Promise<void> {
	if (!db) return console.error("DB is not ready yet!")
	const config = (await db.collection<Config>("config").findOne({ name: "config" }))!,
		stationData = await fetch(
			"https://emel.city-platform.com/maps/wfs?REQUEST=GetFeature&typeNames=emel_gira_stations&outputFormat=application/json"
		)
			.then(r => r.json() as Promise<GiraListStationsResponse>)
			.then(d => d.features.filter(f => !config.buggedIDs.includes(parseInt(f.properties.id_expl))))
			.catch(() => null)

	if (!stationData) {
		setTimeout(main, 10_000)
		return
	}
	await db.collection<StationData>("stations").bulkWrite(
		stationData.map(f => ({
			updateOne: {
				filter: {
					id: parseInt(f.properties.id_expl),
				},
				update: {
					$set: {
						coordinates: f.geometry.coordinates[0],
						name: f.properties.desig_comercial,
						numBikes: f.properties.num_bicicletas,
						numDocks: f.properties.num_docas,
						bikePercentage: Math.round(f.properties.racio * 100),
						status: f.properties.estado,
						updatedAt: Date.parse(f.properties.update_date),
					},
				},
				upsert: true,
			},
		}))
	)
	// await db
	// 	.collection<StatsData>("stats")
	// 	.bulkWrite(
	// 		stationData.map(f => ({
	// 			updateOne: {
	// 				filter: { id: parseInt(f.properties.id_expl) },
	// 				update: {
	// 					$push: {
	// 						stats: {
	// 							updatedAt: Date.parse(f.properties.update_date),
	// 							numBikes: f.properties.num_bicicletas,
	// 							status: f.properties.estado,
	// 						},
	// 					},
	// 				},
	// 				upsert: true,
	// 			},
	// 		}))
	// 		// Ignore errors due to duplicate entries
	// 	)
	// 	.catch(() => null)

	setTimeout(main, 5 * 60_000)
}

interface StatsData {
	id: number
	stats: {
		updatedAt: number
		numBikes: number
		status: "repair" | "active"
	}[]
}
