import { setTimeout } from "node:timers/promises"

export async function crosspost(channelId: string, messageId: string) {
	let req = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages/${messageId}/crosspost`, {
		method: "POST",
		headers: {
			Authorization: `Bot ${process.env.DISCORD_TOKEN}`,
		},
	})

	while (req.status === 429) {
		const rateLimitReset = parseFloat(req.headers.get("x-ratelimit-reset")!) * 1000, // Header comes in seconds with decimal point
			waitMs = rateLimitReset - Date.now()
		console.log(`Got rate limited, retrying in ${waitMs / 1000} seconds`)
		await setTimeout(waitMs)
		req = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages/${messageId}/crosspost`, {
			method: "POST",
			headers: {
				Authorization: `Bot ${process.env.DISCORD_TOKEN}`,
			},
		})
	}
	return req
}

/**
 * Sends a request to the metro API with the correct authorization token and parses it
 * @param endpoint the API endpoint to fetch, without the leading /
 * @param init extra data to send in the request
 * @returns A JSON response or null if the request fails or the response is not JSON
 */
export async function makeMetroRequest<T>(endpoint: string, init: RequestInit = {}) {
	return await fetch(`https://api.metrolisboa.pt:8243/estadoServicoML/1.0.1/${endpoint}`, {
		...init,
		headers: {
			Authorization: `Bearer ${process.env.METRO_TOKEN}`,
			...init.headers,
		},
	})
		.then(r => r.json() as Promise<MetroResponse<T>>)
		.catch(console.error)
}

/**
 * Correctly parses a malformed array string into an array object of strings. Malformed here is an array without quotation marks for the inner strings
 * @param input malformed array string
 * @returns Parsed array
 */
export function parseMalformedArray(input: string): string[] {
	return (
		input
			// Remove square brackets and whitespace
			.replace(/\[|\]|\s/g, "")
			// Split the string into an array using a comma as the delimiter
			.split(",")
	)
}

export async function sendWebhookMessage(options: WebhookMessageOptions, wait = true) {
	let req = await fetch(`${process.env.DISCORD_WEBHOOK_URL}?wait=${wait}`, {
		method: "POST",
		body: JSON.stringify(options),
		headers: { "Content-Type": "application/json" },
	})

	while (req.status === 429) {
		console.log("Got rate limited")
		const rateLimitReset = parseInt(req.headers.get("x-ratelimit-reset")!)
		await setTimeout(rateLimitReset - Date.now())
		req = await fetch(`${process.env.DISCORD_WEBHOOK_URL}?wait=${wait}`, {
			method: "POST",
			body: JSON.stringify(options),
			headers: { "Content-Type": "application/json" },
		})
	}
	return req
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

export interface Config {
	name: "config"
	favouriteStations: number[]
	toBeReleased: number[]
	favouriteProps: (keyof StationData)[]
	buggedIDs: number[]
}

export interface MetroResponse<T> {
	resposta: T
	codigo: string
}

export interface MetroStationData {
	stop_id: string
	stop_name: string
	stop_lat: string
	stop_lon: string
	stop_url: string
	linha: string
	zone_id: "L" | "C"
}
