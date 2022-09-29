export function parseStationData(data: string, availabilityData: Pick<Properties, "ID_C" | "N_DOCAS">[]): string | StationData {
	const regex =
			/^(?<stationId>\d+) ?- ?(?<stationName>.+( \/ .+)?),(?<bikesAvailable>\d+),(?<freeDocks>\d+),"(?<coordJson>.+)",(?<dateAdded>\d{4}-\d{2}-\d{2}),(?<timeAdded>\d{2}:\d{2}:\d{2})\.$/,
		matches = data.match(regex),
		stationData = availabilityData.find(s => s.ID_C == matches?.groups?.stationId)!
	if (!matches?.groups || !stationData) return data
	const freeDocks = parseInt(matches.groups.freeDocks),
		bikesAvailable = parseInt(matches.groups.bikesAvailable),
		unavailableDocks = stationData.N_DOCAS - (freeDocks + bikesAvailable)

	const result = {
		stationId: parseInt(matches.groups.stationId),
		stationName: matches.groups.stationName,
		bikesAvailable,
		totalDocks: stationData.N_DOCAS,
		freeDocks,
		unavailableDocks,
		percentEnabled: ((stationData.N_DOCAS - unavailableDocks) * 100) / stationData.N_DOCAS,
		// For some reason these come with two quotes around them, so we gotta make that only 1
		coordJson: JSON.parse(matches.groups.coordJson.replaceAll('""', '"')),
		dateAdded: new Date(`${matches.groups.dateAdded}T${matches.groups.timeAdded}`),
	}
	return result
}

export interface StationData {
	stationId: number
	stationName: string
	bikesAvailable: number
	totalDocks: number
	freeDocks: number
	unavailableDocks: number
	percentEnabled: number
	coordJson: {
		coordinates: [long: number, lat: number]
		type: "Point"
	}
	dateAdded: Date
}

export interface GeoDataResponse {
	type: string
	features: StationFeature[]
}

interface StationFeature {
	type: "Feature"
	id: number
	geometry: {
		type: string
		coordinates: [long: number, lat: number]
	}
	properties: Pick<Properties, "ID_C" | "N_DOCAS">
}

interface Properties {
	OBJECTID: number
	//** ID Polícia - stringified number */
	ID_P: string
	//** ID comercial - stringified number */
	ID_C: string
	NOME_RUA: string
	N_POLICIA: string | null
	PONTO_REFERENCIA: string | null
	FREGUESIA: string
	SITUACAO: "Em operação"
	N_DOCAS: number
	LOCALIZACAO_INSTALACAO: "Passeio" | "Estacionamento" | "Outro"
	COD_SIG: string
	IDTIPO: string
	GlobalID: `${string}-${string}-${string}-${string}-${string}`
}
