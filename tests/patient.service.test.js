describe('Patient Service', () => {
  let service

  const mockPool = {
    query: jest.fn(),
  }

  beforeEach(() => {
    jest.mock('../src/config/db', () => ({ pool: mockPool }))
    service = require('../src/services/patient.service')
  })

  afterEach(() => jest.resetModules())

  describe('create', () => {
    test('should insert patient and return it', async () => {
      const inserted = { id: 1, code_patient: 'P-ABCD1234', nom_patient: 'Dupont' }
      mockPool.query.mockResolvedValue({ rows: [inserted] })

      const result = await service.create({
        prenomPatient: 'Jean',
        nomPatient: 'Dupont',
        dateNaissancePatient: '1990-01-01',
        genrePatient: 'Homme',
        createdBy: 'doc1',
      })

      expect(result).toEqual(inserted)
      expect(mockPool.query).toHaveBeenCalledTimes(1)
    })

    test('should retry on unique constraint violation for code', async () => {
      const uniqueErr = new Error('duplicate')
      uniqueErr.code = '23505'
      uniqueErr.constraint = 'patients_code_patient_key'
      mockPool.query
        .mockRejectedValueOnce(uniqueErr)
        .mockResolvedValueOnce({ rows: [{ id: 1, code_patient: 'P-NEWCODE' }] })

      const result = await service.create({
        prenomPatient: 'Jean',
        nomPatient: 'Dupont',
        dateNaissancePatient: '1990-01-01',
        genrePatient: 'Homme',
      })

      expect(result).toBeDefined()
      expect(mockPool.query).toHaveBeenCalledTimes(2)
    })

    test('should throw after 5 retry attempts', async () => {
      const uniqueErr = new Error('duplicate')
      uniqueErr.code = '23505'
      uniqueErr.constraint = 'patients_code_patient_key'
      mockPool.query.mockRejectedValue(uniqueErr)

      await expect(service.create({
        prenomPatient: 'Jean',
        nomPatient: 'Dupont',
        dateNaissancePatient: '1990-01-01',
        genrePatient: 'Homme',
      })).rejects.toThrow('Impossible de générer un code unique')
    })

    test('should throw non-unique errors immediately', async () => {
      mockPool.query.mockRejectedValue(new Error('DB connection error'))

      await expect(service.create({
        prenomPatient: 'Jean',
        nomPatient: 'Dupont',
        dateNaissancePatient: '1990-01-01',
        genrePatient: 'Homme',
      })).rejects.toThrow('DB connection error')
    })
  })

  describe('getById', () => {
    test('should return patient if found', async () => {
      mockPool.query.mockResolvedValue({ rows: [{ id: 1, nom_patient: 'Dupont' }] })
      const result = await service.getById(1)
      expect(result).toBeDefined()
      expect(result.nom_patient).toBe('Dupont')
    })

    test('should throw if not found', async () => {
      mockPool.query.mockResolvedValue({ rows: [] })
      await expect(service.getById(999)).rejects.toThrow('Patient non trouvé')
    })
  })

  describe('update', () => {
    test('should update patient fields', async () => {
      mockPool.query.mockResolvedValue({ rows: [{ id: 1, nom_patient: 'Updated' }] })
      const result = await service.update(1, { nomPatient: 'Updated' })
      expect(result.nom_patient).toBe('Updated')
    })

    test('should throw if no data provided', async () => {
      await expect(service.update(1, {})).rejects.toThrow('Aucune donnée à mettre à jour')
    })

    test('should throw if patient not found', async () => {
      mockPool.query.mockResolvedValue({ rows: [] })
      await expect(service.update(999, { nomPatient: 'Test' })).rejects.toThrow('Patient non trouvé')
    })
  })

  describe('delete', () => {
    test('should delete and return patient', async () => {
      mockPool.query.mockResolvedValue({ rows: [{ id: 1 }] })
      const result = await service.delete(1)
      expect(result).toBeDefined()
    })

    test('should throw if not found', async () => {
      mockPool.query.mockResolvedValue({ rows: [] })
      await expect(service.delete(999)).rejects.toThrow('Patient non trouvé')
    })
  })

  describe('toggleActif', () => {
    test('should activate patient', async () => {
      mockPool.query.mockResolvedValue({ rows: [{ id: 1, actif: true }] })
      const result = await service.toggleActif(1, true)
      expect(result.actif).toBe(true)
    })

    test('should deactivate patient', async () => {
      mockPool.query.mockResolvedValue({ rows: [{ id: 1, actif: false }] })
      const result = await service.toggleActif(1, false)
      expect(result.actif).toBe(false)
    })
  })

  describe('checkDuplicates', () => {
    test('should return matching patients', async () => {
      mockPool.query.mockResolvedValue({ rows: [{ id: 2, nom_patient: 'Dupont' }] })
      const result = await service.checkDuplicates({ nomPatient: 'Dupont' })
      expect(result).toHaveLength(1)
      expect(result[0].nom_patient).toBe('Dupont')
    })

    test('should return empty array if no criteria', async () => {
      const result = await service.checkDuplicates({})
      expect(result).toEqual([])
    })
  })

  describe('getAll', () => {
    test('should return paginated results without filters', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [{ count: '5' }] })
        .mockResolvedValueOnce({ rows: [{ id: 1 }, { id: 2 }] })

      const result = await service.getAll({})
      expect(result.patients).toHaveLength(2)
      expect(result.total).toBe(5)
      expect(result.page).toBe(1)
    })

    test('should apply search filter', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [{ count: '1' }] })
        .mockResolvedValueOnce({ rows: [{ id: 1 }] })

      const result = await service.getAll({ search: 'Dupont' })
      expect(result.total).toBe(1)
    })

    test('should apply hospital filter', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [{ count: '2' }] })
        .mockResolvedValueOnce({ rows: [{ id: 1 }] })

      const result = await service.getAll({ hopital: 'Central' })
      expect(result.total).toBe(2)
    })
  })
})
