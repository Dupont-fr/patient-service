const express = require('express')
const router = express.Router()
const PatientController = require('../controllers/patient.controller')
const AntecedentController = require('../controllers/antecedent.controller')
const authenticate = require('../middlewares/auth.middleware')

router.use(authenticate)

router.get('/', PatientController.getAll)
router.get('/:patientId/antecedents', AntecedentController.getByPatient)
router.post('/:patientId/antecedents', AntecedentController.create)
router.put('/:patientId/antecedents/:id', AntecedentController.update)
router.delete('/:patientId/antecedents/:id', AntecedentController.delete)
router.get('/:id', PatientController.getById)
router.post('/', PatientController.create)
router.put('/:id', PatientController.update)
router.delete('/:id', PatientController.delete)
router.post('/check-duplicates', PatientController.checkDuplicates)
router.put('/:id/desactiver', PatientController.desactiver)
router.put('/:id/reactiver', PatientController.reactiver)

module.exports = router
