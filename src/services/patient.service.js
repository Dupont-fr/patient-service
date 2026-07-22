const crypto = require('crypto')
const { pool } = require('../config/db')

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const CODE_LENGTH = 8

function generateCode() {
  let code = ''
  const bytes = crypto.randomBytes(CODE_LENGTH)
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length]
  }
  return 'P-' + code
}

class PatientService {
  static async create(data) {
    const {
      prenomPatient,
      nomPatient,
      dateNaissancePatient,
      genrePatient,
      telephonePatient,
      nomPere,
      nomMere,
      adresseRue,
      adresseVille,
      adresseCodePostal,
      religionPatient: religion,
      situationMatrimonialePatient: situationMatrimoniale,
      paysPatient: pays,
      lieuNaissancePatient: lieuNaissance,
      groupeSanguinPatient: groupeSanguin,
      rhesusPatient: rhesus,
      professionPatient: profession,
      hopital,
      createdBy,
    } = data

    if (telephonePatient) {
      const digits = telephonePatient.replace(/\D/g, '')
      if (digits.length !== 9)
        throw new Error(
          'Le numéro de téléphone doit contenir exactement 9 chiffres sans indicatif du pays',
        )
    }

    let code, result
    for (let attempt = 0; attempt < 5; attempt++) {
      code = generateCode()
      try {
        result = await pool.query(
          `INSERT INTO patients (
            code_patient, prenom_patient, nom_patient, date_naissance_patient,
            genre_patient, telephone_patient,
            nom_pere, nom_mere,
            adresse_rue, adresse_ville, adresse_code_postal,
            religion, situation_matrimoniale, pays, lieu_naissance,
            groupe_sanguin, rhesus, profession,
            hopital, created_by
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)
          RETURNING *`,
          [
            code,
            prenomPatient,
            nomPatient || null,
            dateNaissancePatient,
            genrePatient,
            telephonePatient || null,
            nomPere || null,
            nomMere || null,
            adresseRue || null,
            adresseVille || null,
            adresseCodePostal || null,
            religion || null,
            situationMatrimoniale || null,
            pays || 'Cameroun',
            lieuNaissance || null,
            groupeSanguin || null,
            rhesus || null,
            profession || null,
            hopital || null,
            createdBy || null,
          ],
        )
        return result.rows[0]
      } catch (err) {
        if (err.code === '23505' && err.constraint?.includes('code_patient'))
          continue
        throw err
      }
    }
    throw new Error('Impossible de générer un code unique après 5 tentatives')
  }

  static async getAll(filters = {}) {
    const { search, hopital, page = 1, limit = 50 } = filters
    const conditions = []
    const params = []
    let idx = 1

    if (hopital) {
      conditions.push(`hopital = $${idx++}`)
      params.push(hopital)
    }

    const searchTerm = (search || '').trim()
    if (searchTerm) {
      const words = searchTerm.split(/\s+/)
      if (words.length === 1) {
        conditions.push(
          `(code_patient ILIKE $${idx} OR prenom_patient ILIKE $${idx} OR nom_patient ILIKE $${idx} OR telephone_patient ILIKE $${idx})`,
        )
        params.push(`%${searchTerm}%`)
      } else {
        const full = `prenom_patient || ' ' || nom_patient`
        const rev = `nom_patient || ' ' || prenom_patient`
        conditions.push(`(${full} ILIKE $${idx} OR ${rev} ILIKE $${idx})`)
        params.push(`%${searchTerm}%`)
      }
      idx++
    }

    const where =
      conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
    const offset = (page - 1) * limit

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM patients ${where}`,
      params,
    )
    const total = parseInt(countResult.rows[0].count, 10)

    const dataResult = await pool.query(
      `SELECT * FROM patients ${where} ORDER BY created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, limit, offset],
    )

    return {
      patients: dataResult.rows,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
    }
  }

  static async getById(id) {
    const result = await pool.query('SELECT * FROM patients WHERE id = $1', [
      id,
    ])
    if (result.rows.length === 0) throw new Error('Patient non trouvé')
    return result.rows[0]
  }

  static async update(id, data) {
    if (data.telephonePatient) {
      const digits = data.telephonePatient.replace(/\D/g, '')
      if (digits.length !== 9)
        throw new Error(
          'Le numéro de téléphone doit contenir exactement 9 chiffres',
        )
    }

    const fields = []
    const params = []
    let idx = 1

    const map = {
      prenomPatient: 'prenom_patient',
      nomPatient: 'nom_patient',
      dateNaissancePatient: 'date_naissance_patient',
      genrePatient: 'genre_patient',
      telephonePatient: 'telephone_patient',
      nomPere: 'nom_pere',
      nomMere: 'nom_mere',
      adresseRue: 'adresse_rue',
      adresseVille: 'adresse_ville',
      adresseCodePostal: 'adresse_code_postal',
      religionPatient: 'religion',
      situationMatrimonialePatient: 'situation_matrimoniale',
      paysPatient: 'pays',
      lieuNaissancePatient: 'lieu_naissance',
      groupeSanguinPatient: 'groupe_sanguin',
      rhesusPatient: 'rhesus',
      professionPatient: 'profession',
      hopital: 'hopital',
    }

    for (const [key, col] of Object.entries(map)) {
      if (data[key] !== undefined) {
        fields.push(`${col} = $${idx++}`)
        params.push(data[key])
      }
    }

    if (fields.length === 0) throw new Error('Aucune donnée à mettre à jour')

    fields.push(`updated_at = CURRENT_TIMESTAMP`)
    params.push(id)

    const result = await pool.query(
      `UPDATE patients SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      params,
    )

    if (result.rows.length === 0) throw new Error('Patient non trouvé')
    return result.rows[0]
  }

  static async delete(id) {
    const result = await pool.query(
      'DELETE FROM patients WHERE id = $1 RETURNING *',
      [id],
    )
    if (result.rows.length === 0) throw new Error('Patient non trouvé')
    return result.rows[0]
  }

  static async toggleActif(id, actif) {
    const result = await pool.query(
      'UPDATE patients SET actif = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [actif, id],
    )
    if (result.rows.length === 0) throw new Error('Patient non trouvé')
    return result.rows[0]
  }

  static async checkDuplicates(data) {
    const {
      prenomPatient,
      nomPatient,
      dateNaissancePatient,
      telephonePatient,
    } = data
    const sqlConditions = []
    const params = []
    let idx = 1

    if (nomPatient) {
      sqlConditions.push(`nom_patient ILIKE $${idx}`)
      params.push(`%${nomPatient}%`)
      idx++
    }
    if (prenomPatient) {
      sqlConditions.push(`prenom_patient ILIKE $${idx}`)
      params.push(`%${prenomPatient}%`)
      idx++
    }
    if (dateNaissancePatient) {
      sqlConditions.push(`date_naissance_patient = $${idx}`)
      params.push(dateNaissancePatient)
      idx++
    }
    if (telephonePatient) {
      const tel = telephonePatient.replace(/[^\d]/g, '')
      if (tel) {
        sqlConditions.push(
          `REGEXP_REPLACE(telephone_patient, '[^0-9]', '', 'g') ILIKE $${idx}`,
        )
        params.push(`%${tel}%`)
        idx++
      }
    }

    if (sqlConditions.length === 0) return []

    const sql = `SELECT * FROM patients WHERE ${sqlConditions.join(' OR ')} ORDER BY created_at DESC`
    const result = await pool.query(sql, params)

    return result.rows.map((row) => {
      const matchedFields = []
      if (
        nomPatient &&
        row.nom_patient?.toLowerCase().includes(nomPatient.toLowerCase())
      )
        matchedFields.push('lastName')
      if (
        prenomPatient &&
        row.prenom_patient?.toLowerCase().includes(prenomPatient.toLowerCase())
      )
        matchedFields.push('firstName')
      if (
        dateNaissancePatient &&
        row.date_naissance_patient
          ?.toISOString()
          .startsWith(dateNaissancePatient)
      )
        matchedFields.push('dateOfBirth')
      if (telephonePatient) {
        const telClean = telephonePatient.replace(/[^\d]/g, '')
        const rowTelClean = (row.telephone_patient || '').replace(/[^\d]/g, '')
        if (telClean && rowTelClean.includes(telClean))
          matchedFields.push('phone')
      }
      return { ...row, matchedFields }
    })
  }
}

module.exports = PatientService
