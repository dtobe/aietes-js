const axios = require('axios');
const express = require('express');
const router = express.Router();
const config = require('config');

router.get('/', async (req, res, next) => {
    try {
        const btcPrice = await getBitcoinPrice();
        res.json({'btcPrice': btcPrice});
    } catch (err) {
        console.log("Some Error");
        return next(err);
    }
});

router.get('/example', async (req, res, next) => {
    try {
        const btcPrice = await getBitcoinPrice();

        if (btcPrice > 5000) {
            res.json({
                'btcPrice': {
                    "up": `${btcPrice}`
                }
            });
        } else {
            res.json({
                'btcPrice': {
                    "down": `${btcPrice}`
                }
            });
        }
    } catch (err) {
        console.log(`Some Error ${JSON.stringify(err)}`);
        return next(err);
    }
});

const getBitcoinPrice = async () => {
    const URL = config.get('end-point.external-service.currentprice');

    const response = await axios.get(URL);
    const data = await response.data.bpi.USD.rate_float;

    return data;
};

module.exports = router;