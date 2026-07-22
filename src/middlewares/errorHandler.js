const errorHandler = (err, req, res, next) => {
  console.error('❌ Erreur:', err.message)

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Données invalides',
      errors: Object.values(err.errors).map(e => e.message),
    })
  }

  if (err.code === 11000) {
    return res.status(409).json({
      success: false,
      message: 'Cette valeur existe déjà',
    })
  }

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Erreur interne du serveur',
  })
}

module.exports = errorHandler
