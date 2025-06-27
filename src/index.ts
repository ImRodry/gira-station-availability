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
	const parsedData: StationData[] = stationData.map(f => ({
		id: parseInt(f.properties.id_expl),
		coordinates: f.geometry.coordinates[0],
		name: f.properties.desig_comercial,
		numBikes: f.properties.num_bicicletas,
		numDocks: f.properties.num_docas,
		bikePercentage: Math.round(f.properties.racio * 100),
		status: f.properties.estado,
		updatedAt: Date.parse(f.properties.update_date),
	}))
	await db.collection<StationData>("stations").bulkWrite(
		parsedData.map(({ id, ...station }) => ({
			updateOne: {
				filter: { id },
				update: { $set: station },
				upsert: true,
			},
		}))
	)
	if (config.saveStats) {
		const currHour = new Date().getHours()
		if (currHour >= 6 || currHour < 2)
			// Only track stats during service hours (6:00 - 2:00)
			await db
				.collection<StatsData>("stats")
				.insertOne({
					timestamp: Math.max(...parsedData.map(s => s.updatedAt)),
					data: Object.fromEntries(parsedData.filter(s => s.status === "active").map(s => [s.id, s.numBikes])),
					bikesAvailable: parsedData.reduce((acc, s) => acc + s.numBikes, 0),
				})
				// Ignore errors due to duplicate entries
				.catch(() => null)
	}

	setTimeout(main, 5 * 60_000)
}

interface StatsData {
	timestamp: number
	data: Record<number, number> // Station ID to number of bikes
	bikesAvailable: number // Total number of bikes available across all stations
}
