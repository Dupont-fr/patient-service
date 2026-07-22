const AntecedentService = require('../services/antecedent.service')

class AntecedentController {
  static async getByPatient(req, res, next) {
    try {
      const antecedents = await AntecedentService.getByPatient(req.params.patientId)
      res.json({ success: true, data: antecedents })
    } catch (error) {
      next(error)
    }
  }

  static async create(req, res, next) {
    try {
      const antecedent = await AntecedentService.create({
        patientId: req.params.patientId,
        hopital: req.user?.hospitalUser || null,
        type: req.body.type,
        description: req.body.description,
        date: req.body.date || null,
        createdBy: req.user?.id,
      })
      res.status(201).json({ success: true, data: antecedent })
    } catch (error) {
      next(error)
    }
  }

  static async update(req, res, next) {
    try {
      const antecedent = await AntecedentService.update(
        req.params.id,
        req.body,
        req.user?.hospitalUser,
      )
      res.json({ success: true, data: antecedent })
    } catch (error) {
      next(error)
    }
  }

  static async delete(req, res, next) {
    try {
      await AntecedentService.delete(req.params.id, req.user?.hospitalUser)
      res.json({ success: true, message: 'Antécédent supprimé' })
    } catch (error) {
      next(error)
    }
  }
}

module.exports = AntecedentController