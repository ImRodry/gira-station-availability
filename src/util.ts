export async function sendWebhookMessage(options: WebhookMessageOptions, wait = false) {
	return fetch(`${process.env.DISCORD_WEBHOOK_URL}?wait=${wait}`, {
		method: "POST",
		body: JSON.stringify(options),
		headers: { "Content-Type": "application/json" },
	}).then(res => (wait ? res.json() : null))
}

interface WebhookMessageOptions {
	content: string
	username?: string
	avatarURL?: string
}

export interface StationData {
	id: number
	coordinates: [long: number, lat: number]
	name: string
	numBikes: number
	numDocks: number
	bikePercentage: number
	status: "active" | "repair"
	updatedAt: number
}

export interface GiraListStationsResponse {
	type: "FeatureCollection"
	totalFeatures: number
	features: GiraStationFeature[]
}

interface GiraStationFeature {
	type: "Feature"
	geometry: {
		type: "MultiPoint"
		coordinates: [long: number, lat: number][]
	}
	properties: {
		id_expl: string
		id_planeamento: string
		desig_comercial: string
		tipo_servico_niveis: "A" | "B" | ""
		num_bicicletas: number
		num_docas: number
		racio: number
		estado: "active" | "repair"
		update_date: string
		bbox: number[]
	}
}
