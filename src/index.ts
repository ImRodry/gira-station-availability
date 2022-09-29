import { Collection } from "@discordjs/collection"

import { GeoDataResponse, parseStationData, StationData } from "./util"

async function main() {
	const rawData = await fetch("https://dados.gov.pt/en/datasets/r/c5c9e585-8990-4e19-a720-5c0ac3191705")
			// Result is a CSV file, so we need to parse it as text
			.then(r => r.text())
			// We then isolate each entry by splitting on newlines and filtering empty lines
			.then(d => d.split("\n").filter(Boolean)),
		availabilityData = await fetch(
			"https://services.arcgis.com/1dSrzEWVQn5kHHyK/arcgis/rest/services/Ciclovias/FeatureServer/3/query?outFields=N_DOCAS,ID_C&where=1%3D1&f=geojson"
		)
			.then(r => r.json() as Promise<GeoDataResponse>)
			.then(r => r.features.map(f => f.properties))

	// Remove the first line as it only contains the names of the parameters
	rawData.shift()
	const stationData = new Collection(
		(rawData.map(d => parseStationData(d, availabilityData)).filter(d => typeof d !== "string") as StationData[])
			.sort((a, b) => b.percentEnabled - a.percentEnabled + (a.stationId - b.stationId))
			.map(s => [s.stationId, s])
	)

	console.log(stationData.map(s => s.bikesAvailable).reduce((a, b) => a + b))
}

main()

setInterval(main, 10_000)
