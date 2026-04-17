const express = require('express');
const router = express.Router();

const addressController = require('./address.controller');
const { authenticate } = require("../../middleware/auth.middleware");
const { validateAddress } = require('./address.validate');

router.get('/', authenticate, addressController.getAddresses);

router.post('/', authenticate, validateAddress, addressController.createAddress);

router.put('/:id', authenticate, validateAddress, addressController.updateAddress);

router.patch('/:id/default', authenticate, addressController.setDefaultAddress);

router.delete('/:id', authenticate, addressController.deleteAddress);

module.exports = router;