const addressService = require('./address.service');

const getAddresses = async (req, res) => {
    try {
        const data = await addressService.getAddresses(req.user.id);

        res.status(200).json({
            success: true,
            message: "Addresses retrieved successfully",
            data,
        });
    } catch(error) {
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

const createAddress = async (req, res) => {
    try {
        const data = await addressService.createAddress(
            req.user.id,
            req.body
        );

        res.status(201).json({
            success: true,
            message: "Address created successfully",
            data,
        });
    } catch(error) {
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

const updateAddress = async (req, res) => {
    try {
        const data = await addressService.updateAddress(
            req.user.id,
            req.params.id,
            req.body
        );

        res.status(200).json({
            success: true,
            message: "Address updated successfully",
            data,
        });
    } catch(error) {
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

const setDefaultAddress = async (req, res) => {
    try {
        const data = await addressService.setDefaultAddress(
            req.user.id,
            req.params.id
        );

        res.status(200).json({
            success: true,
            message: "Default address set successfully",
            data,
        });
    } catch(error) {
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

const deleteAddress = async (req, res) => {
    try {
        const result = await addressService.deleteAddress(
            req.user.id,
            req.params.id
        );

        res.status(200).json({
            success: true,
            data: result,
        });
    } catch(error) {
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

module.exports = {
    getAddresses,
    createAddress,
    updateAddress,
    setDefaultAddress,
    deleteAddress,
};