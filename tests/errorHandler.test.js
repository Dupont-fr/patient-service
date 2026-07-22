describe('Patient Error Handler', () => {
  let errorHandler
  let req, res

  beforeEach(() => {
    errorHandler = require('../src/middlewares/errorHandler')
    req = { method: 'POST', originalUrl: '/api/patients' }
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    }
  })

  test('should return 500 by default', () => {
    errorHandler(new Error('fail'), req, res, jest.fn())
    expect(res.status).toHaveBeenCalledWith(500)
  })

  test('should return 400 for ValidationError', () => {
    const err = new Error('validation')
    err.name = 'ValidationError'
    err.errors = [{ message: 'required' }]
    errorHandler(err, req, res, jest.fn())
    expect(res.status).toHaveBeenCalledWith(400)
  })

  test('should return 409 for duplicate key', () => {
    const err = new Error('duplicate')
    err.code = 11000
    errorHandler(err, req, res, jest.fn())
    expect(res.status).toHaveBeenCalledWith(409)
  })

  test('should return custom status if set', () => {
    const err = new Error('custom')
    err.status = 403
    errorHandler(err, req, res, jest.fn())
    expect(res.status).toHaveBeenCalledWith(403)
  })
})
