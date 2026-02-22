import { disconnectDb, getPrisma, resetDb } from './_helpers/db'

// Optional: run migrations automatically if you set RUN_MIGRATIONS=1
// This keeps CI simple if you want it.
import { execSync } from 'node:child_process'

beforeAll(async () => {
	if (process.env.RUN_MIGRATIONS === '1') {
		// Runs prisma migrations against DATABASE_URL
		execSync('npx prisma migrate deploy', { stdio: 'inherit' })
	}
	await getPrisma()
})

beforeEach(async () => {
	await resetDb()
})

afterAll(async () => {
	await disconnectDb()
})
