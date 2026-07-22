const { pool } = require('../config/db')

class AntecedentService {
  static async getByPatient(patientId) {
    const result = await pool.query(
      `SELECT * FROM antecedents WHERE patient_id = $1 ORDER BY created_at DESC`,
      [patientId],
    )
    return result.rows
  }

  static async create(data) {
    const { patientId, hopital, type, description, date, createdBy } = data
    const result = await pool.query(
      `INSERT INTO antecedents (patient_id, hopital, type, description, date, created_by)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [patientId, hopital, type, description, date || null, createdBy || null],
    )
    return result.rows[0]
  }

  static async update(id, data, userHospital) {
    const existing = await pool.query(`SELECT * FROM antecedents WHERE id = $1`, [id])
    if (existing.rows.length === 0) throw new Error('Antécédent non trouvé')
    if (existing.rows[0].hopital !== userHospital) {
      throw new Error('Seul l\'hôpital d\'origine peut modifier cet antécédent')
    }

    const { type, description, date } = data
    const result = await pool.query(
      `UPDATE antecedents SET type = $1, description = $2, date = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4 RETURNING *`,
      [type, description, date || null, id],
    )
    return result.rows[0]
  }

  static async delete(id, userHospital) {
    const existing = await pool.query(`SELECT * FROM antecedents WHERE id = $1`, [id])
    if (existing.rows.length === 0) throw new Error('Antécédent non trouvé')
    if (existing.rows[0].hopital !== userHospital) {
      throw new Error('Seul l\'hôpital d\'origine peut supprimer cet antécédent')
    }

    await pool.query(`DELETE FROM antecedents WHERE id = $1`, [id])
  }
}

module.exports = AntecedentService