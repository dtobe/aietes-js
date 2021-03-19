const express = require('express')
const router = express.Router()

const bitcoin = require('./bitcoinPriceService')
router.use('/', bitcoin)

module.exports = router
