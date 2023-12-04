import { MongoClient } from "mongodb"

const url = process.env.MONGO_URL
if (!url) {
	console.error("No mongo URL provided. Please set the MONGO_URL environment variable.")
	process.exit(1)
}

export const mongoClient = new MongoClient(url)

export let db = mongoClient.db()

mongoClient.connect().then(() => {
	db = mongoClient.db()
	console.log("Connected to MongoDB!")
})
