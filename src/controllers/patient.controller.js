const PatientService = require('../services/patient.service')

class PatientController {
  static async create(req, res, next) {
    try {
      const patient = await PatientService.create({
        ...req.body,
        hopital: req.user?.hospitalUser || null,
        createdBy: req.user?.id,
      })
      res.status(201).json({ success: true, data: patient })
    } catch (error) {
      next(error)
    }
  }

  static async getAll(req, res, next) {
    try {
      const filters = { ...req.query }
      if (req.user?.role === 'ADMIN') {
        // Admin voit tout
      } else if (filters.search) {
        // Recherche globale : pas de filtre hôpital
      } else if (req.user?.hospitalUser) {
        filters.hopital = req.user.hospitalUser
      }
      const result = await PatientService.getAll(filters)
      res.json({ success: true, ...result })
    } catch (error) {
      next(error)
    }
  }

  static async getById(req, res, next) {
    try {
      const patient = await PatientService.getById(req.params.id)
      res.json({ success: true, data: patient })
    } catch (error) {
      next(error)
    }
  }

  static async update(req, res, next) {
    try {
      const existing = await PatientService.getById(req.params.id)
      if (req.user?.role !== 'ADMIN' && req.user?.hospitalUser && existing.hopital !== req.user.hospitalUser) {
        return res.status(403).json({ success: false, message: 'Ce patient est en lecture seule depuis votre hôpital' })
      }
      const patient = await PatientService.update(req.params.id, req.body)
      res.json({ success: true, data: patient })
    } catch (error) {
      next(error)
    }
  }

  static async delete(req, res, next) {
    try {
      const existing = await PatientService.getById(req.params.id)
      if (req.user?.role !== 'ADMIN' && req.user?.hospitalUser && existing.hopital !== req.user.hospitalUser) {
        return res.status(403).json({ success: false, message: 'Ce patient est en lecture seule depuis votre hôpital' })
      }
      await PatientService.delete(req.params.id)
      res.json({ success: true, message: 'Patient supprimé définitivement' })
    } catch (error) {
      next(error)
    }
  }

  static async desactiver(req, res, next) {
    try {
      const existing = await PatientService.getById(req.params.id)
      if (req.user?.role !== 'ADMIN' && req.user?.hospitalUser && existing.hopital !== req.user.hospitalUser) {
        return res.status(403).json({ success: false, message: 'Ce patient est en lecture seule depuis votre hôpital' })
      }
      const patient = await PatientService.toggleActif(req.params.id, false)
      res.json({ success: true, message: 'Patient désactivé', data: patient })
    } catch (error) {
      next(error)
    }
  }

  static async reactiver(req, res, next) {
    try {
      const existing = await PatientService.getById(req.params.id)
      if (req.user?.role !== 'ADMIN' && req.user?.hospitalUser && existing.hopital !== req.user.hospitalUser) {
        return res.status(403).json({ success: false, message: 'Ce patient est en lecture seule depuis votre hôpital' })
      }
      const patient = await PatientService.toggleActif(req.params.id, true)
      res.json({ success: true, message: 'Patient réactivé', data: patient })
    } catch (error) {
      next(error)
    }
  }

  static async checkDuplicates(req, res, next) {
    try {
      const duplicates = await PatientService.checkDuplicates(req.body)
      res.json({ success: true, duplicates, hasDuplicates: duplicates.length > 0 })
    } catch (error) {
      next(error)
    }
  }
}

module.exports = PatientController
