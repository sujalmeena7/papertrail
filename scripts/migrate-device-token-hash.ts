import { Pool } from "pg"
import { createHash } from "crypto"
import "dotenv/config"

async function run() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: true,
  })

  console.log("Adding tokenHash/tokenPrefix columns...")
  await pool.query(`ALTER TABLE device_tokens ADD COLUMN IF NOT EXISTS "tokenHash" text;`)
  await pool.query(`ALTER TABLE device_tokens ADD COLUMN IF NOT EXISTS "tokenPrefix" text;`)

  console.log("Backfilling hashes for existing tokens...")
  const { rows } = await pool.query<{ id: string; token: string }>(
    `SELECT id, token FROM device_tokens WHERE token IS NOT NULL`
  )

  let backfilled = 0
  for (const row of rows) {
    const tokenHash = createHash("sha256").update(row.token).digest("hex")
    const tokenPrefix = row.token.slice(0, 12)
    await pool.query(
      `UPDATE device_tokens SET "tokenHash" = $1, "tokenPrefix" = $2 WHERE id = $3`,
      [tokenHash, tokenPrefix, row.id]
    )
    backfilled++
  }
  console.log(`Backfilled ${backfilled}/${rows.length} rows.`)

  const { rows: countRows } = await pool.query<{ count: string }>(
    `SELECT count(*)::text AS count FROM device_tokens`
  )
  const totalRows = Number(countRows[0].count)

  if (backfilled !== totalRows) {
    console.error(
      `Backfill mismatch: backfilled ${backfilled} rows but table has ${totalRows}. Aborting before dropping the "token" column.`
    )
    await pool.end()
    process.exit(1)
  }

  console.log("Enforcing NOT NULL / UNIQUE on tokenHash...")
  await pool.query(`ALTER TABLE device_tokens ALTER COLUMN "tokenHash" SET NOT NULL;`)
  try {
    await pool.query(
      `ALTER TABLE device_tokens ADD CONSTRAINT device_tokens_tokenHash_unique UNIQUE ("tokenHash");`
    )
  } catch (e) {
    console.log("Unique constraint on tokenHash already exists, skipping:", (e as Error).message)
  }
  await pool.query(`ALTER TABLE device_tokens ALTER COLUMN "tokenPrefix" SET NOT NULL;`)

  console.log("Dropping plaintext token column...")
  await pool.query(`ALTER TABLE device_tokens DROP COLUMN IF EXISTS token;`)

  console.log("Done!")
  await pool.end()
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
