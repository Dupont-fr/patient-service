require('dotenv').config()
const { pool } = require('./config/db')
const path = require('path')
const { execSync } = require('child_process')

function getUserHospital(userId) {
  if (!userId) return null
  try {
    const scriptPath = path.resolve(__dirname, '../../user-service/src/scripts/get-user-hospital.cjs')
    const result = execSync(`node "${scriptPath}" "${userId}"`, {
      encoding: 'utf-8',
      timeout: 10000,
      stdio: ['pipe', 'pipe', 'pipe'],
    })
    return result.trim() || null
  } catch {
    return null
  }
}

async function backfill() {
  console.log('🔍 Recherche des patients sans hôpital...')

  const patients = await pool.query(
    `SELECT p.id, p.code_patient, p.nom_patient, p.prenom_patient, p.created_by
     FROM patients p
     WHERE p.hopital IS NULL
     ORDER BY p.id`
  )

  if (patients.rows.length === 0) {
    console.log('✅ Aucun patient sans hôpital.')
    await pool.end()
    return
  }

  console.log(`📋 ${patients.rows.length} patient(s) sans hôpital trouvé(s)`)

  let updated = 0
  for (const p of patients.rows) {
    const cons = await pool.query(
      `SELECT doctor_hospital
       FROM consultations
       WHERE patient_id = $1 AND doctor_hospital IS NOT NULL
       ORDER BY consultation_date ASC
       LIMIT 1`,
      [p.id]
    )

    let hospital = null

    if (cons.rows.length > 0) {
      hospital = cons.rows[0].doctor_hospital
      console.log(`  ✅ Patient #${p.id} (${p.code_patient || '?'}) → consultation: ${hospital}`)
    } else {
      hospital = getUserHospital(p.created_by)
      if (hospital) {
        console.log(`  ✅ Patient #${p.id} (${p.code_patient || '?'}) → créateur: ${hospital}`)
      } else {
        console.log(`  ⏭️  Patient #${p.id} (${p.code_patient || '?'}) — aucune source trouvée`)
        continue
      }
    }

    await pool.query(
      `UPDATE patients SET hopital = $1 WHERE id = $2`,
      [hospital, p.id]
    )
    updated++
  }

  console.log(`\n🎯 ${updated}/${patients.rows.length} patient(s) mis à jour`)
  await pool.end()
}

backfill().catch((err) => {
  console.error('❌ Erreur:', err.message)
  process.exit(1)
})
