import { setTimeout } from "node:timers/promises"

export async function crosspost(channelId: string, messageId: string) {
	let req = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages/${messageId}/crosspost`, {
		method: "POST",
		headers: {
			Authorization: `Bot ${process.env.DISCORD_TOKEN}`,
		},
	})

	while (req.status === 429) {
		console.log("Got rate limited")
		const rateLimitReset = parseInt(req.headers.get("x-ratelimit-reset")!)
		await setTimeout(rateLimitReset - Date.now())
		req = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages/${messageId}/crosspost`, {
			method: "POST",
			headers: {
				Authorization: `Bot ${process.env.DISCORD_TOKEN}`,
			},
		})
	}
	return req
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
