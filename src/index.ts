if (process.env.NODE_ENV !== "production") require("dotenv").config()
require("./dbConnection")
import { readdirSync } from "node:fs"
import { db } from "./dbConnection"
import { GiraListStationsResponse, StationData } from "./util"

if (!process.env.GIRA_API_KEY) {
	console.log("No API key provided. Please set the GIRA_API_KEY environment variable.")
	process.exit(1)
}

readdirSync("./dist/events")
	.filter(path => path.endsWith(".js"))
	.forEach(file => require(`./events/${file}`))

export async function main() {
	if (!db) return console.error("DB is not ready yet!")
	const stationData = await fetch("https://emel.city-platform.com/opendata/gira/station/list", {
		headers: { api_key: process.env.GIRA_API_KEY! },
	}).then(r => r.json() as Promise<GiraListStationsResponse>)

	await db.collection<StationData>("stations").bulkWrite(
		stationData.features.map(f => ({
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
	await db.collection<StasData>("stats").bulkWrite(
		stationData.features.map(f => ({
			updateOne: {
				filter: { id: parseInt(f.properties.id_expl) },
				update: {
					$push: {
						stats: {
							updatedAt: Date.parse(f.properties.update_date),
							numBikes: f.properties.num_bicicletas,
							status: f.properties.estado,
						},
					},
				},
				upsert: true,
			},
		}))
	)

	setTimeout(main, 10_000)
}

interface StasData {
	id: number
	stats: {
		updatedAt: number
		numBikes: number
		status: "repair" | "active"
	}[]
}
