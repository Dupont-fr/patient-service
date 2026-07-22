const { Pool } = require('pg')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
})

pool.on('error', (err) => {
  console.error('❌ Erreur inattendue du pool PostgreSQL:', err.message)
})

const initDB = async () => {
  const client = await pool.connect()
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS patients (
        id SERIAL PRIMARY KEY,
        code_patient VARCHAR(20) UNIQUE,
        prenom_patient VARCHAR(255) NOT NULL,
        nom_patient VARCHAR(255),
        date_naissance_patient DATE NOT NULL,
        genre_patient VARCHAR(10) NOT NULL CHECK (genre_patient IN ('Homme', 'Femme')),
        telephone_patient VARCHAR(50),
        nom_pere VARCHAR(255),
        nom_mere VARCHAR(255),
        adresse_rue VARCHAR(255),
        adresse_ville VARCHAR(255),
        adresse_code_postal VARCHAR(20),
        hopital VARCHAR(255),
        created_by VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    await client.query(`ALTER TABLE patients ALTER COLUMN created_by TYPE VARCHAR(255)`).catch(() => {})
    await client.query(`ALTER TABLE patients ADD COLUMN IF NOT EXISTS code_patient VARCHAR(20) UNIQUE`).catch(() => {})
    await client.query(`ALTER TABLE patients ADD COLUMN IF NOT EXISTS actif BOOLEAN DEFAULT true`).catch(() => {})
    await client.query(`ALTER TABLE patients ADD COLUMN IF NOT EXISTS religion VARCHAR(100)`).catch(() => {})
    await client.query(`ALTER TABLE patients ADD COLUMN IF NOT EXISTS situation_matrimoniale VARCHAR(50)`).catch(() => {})
    await client.query(`ALTER TABLE patients ADD COLUMN IF NOT EXISTS pays VARCHAR(100) DEFAULT 'Cameroun'`).catch(() => {})
    await client.query(`ALTER TABLE patients ADD COLUMN IF NOT EXISTS lieu_naissance VARCHAR(255)`).catch(() => {})
    await client.query(`ALTER TABLE patients ADD COLUMN IF NOT EXISTS groupe_sanguin VARCHAR(5)`).catch(() => {})
    await client.query(`ALTER TABLE patients ADD COLUMN IF NOT EXISTS rhesus VARCHAR(10)`).catch(() => {})
    await client.query(`ALTER TABLE patients ADD COLUMN IF NOT EXISTS profession VARCHAR(255)`).catch(() => {})

    await client.query(`
      CREATE TABLE IF NOT EXISTS antecedents (
        id SERIAL PRIMARY KEY,
        patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
        hopital VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL CHECK (type IN ('allergie', 'chirurgical', 'chronique', 'medical', 'familial', 'autre')),
        description TEXT NOT NULL,
        date DATE,
        created_by VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    console.log('✅ Table "patients" prête')
    console.log('✅ Table "antecedents" prête')
  } finally {
    client.release()
  }
}

module.exports = { pool, initDB }
