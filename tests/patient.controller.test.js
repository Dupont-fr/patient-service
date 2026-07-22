describe('Patient Controller', () => {
  let controller
  let req, res, next

  const mockService = {
    create: jest.fn(),
    getAll: jest.fn(),
    getById: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    toggleActif: jest.fn(),
    checkDuplicates: jest.fn(),
  }

  beforeEach(() => {
    jest.mock('../src/services/patient.service', () => mockService)
    controller = require('../src/controllers/patient.controller')
    req = { body: {}, params: {}, query: {}, user: { id: 'doc1' } }
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    }
    next = jest.fn()
  })

  afterEach(() => jest.resetModules())

  test('create should return 201', async () => {
    mockService.create.mockResolvedValue({ id: 1, nom_patient: 'Dupont' })
    req.body = { nomPatient: 'Dupont' }
    await controller.create(req, res, next)
    expect(res.status).toHaveBeenCalledWith(201)
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true })
    )
  })

  test('create should pass createdBy from req.user', async () => {
    mockService.create.mockResolvedValue({ id: 1 })
    req.body = { nomPatient: 'Dupont' }
    await controller.create(req, res, next)
    expect(mockService.create).toHaveBeenCalledWith(
      expect.objectContaining({ createdBy: 'doc1' })
    )
  })

  test('create should call next on error', async () => {
    mockService.create.mockRejectedValue(new Error('DB error'))
    await controller.create(req, res, next)
    expect(next).toHaveBeenCalledWith(expect.any(Error))
  })

  test('getAll should return paginated results', async () => {
    mockService.getAll.mockResolvedValue({ patients: [], total: 0, page: 1, pages: 0 })
    await controller.getAll(req, res, next)
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true })
    )
  })

  test('getById should return a patient', async () => {
    mockService.getById.mockResolvedValue({ id: 1, nom_patient: 'Dupont' })
    req.params.id = '1'
    await controller.getById(req, res, next)
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true })
    )
  })

  test('update should return updated patient', async () => {
    mockService.update.mockResolvedValue({ id: 1, nom_patient: 'Updated' })
    req.params.id = '1'
    req.body = { nomPatient: 'Updated' }
    await controller.update(req, res, next)
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true })
    )
  })

  test('delete should return success message', async () => {
    mockService.delete.mockResolvedValue({})
    req.params.id = '1'
    await controller.delete(req, res, next)
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true })
    )
  })

  test('desactiver should call toggleActif(false)', async () => {
    mockService.toggleActif.mockResolvedValue({ actif: false })
    req.params.id = '1'
    await controller.desactiver(req, res, next)
    expect(mockService.toggleActif).toHaveBeenCalledWith('1', false)
  })

  test('reactiver should call toggleActif(true)', async () => {
    mockService.toggleActif.mockResolvedValue({ actif: true })
    req.params.id = '1'
    await controller.reactiver(req, res, next)
    expect(mockService.toggleActif).toHaveBeenCalledWith('1', true)
  })

  test('checkDuplicates should return duplicates', async () => {
    mockService.checkDuplicates.mockResolvedValue([{ id: 2 }])
    req.body = { nomPatient: 'Dupont' }
    await controller.checkDuplicates(req, res, next)
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, hasDuplicates: true })
    )
  })
})
