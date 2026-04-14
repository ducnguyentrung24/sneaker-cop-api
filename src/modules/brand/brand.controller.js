const { get } = require("./brand.route");
const brandService = require("./brand.service");

const getBrands = async (req, res) => {
    try {
        const brands = await brandService.getBrands(req.query);

        res.status(200).json({
            success: true,
            data: brands,
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

const getBrandById = async (req, res) => {
    try {
        const brand = await brandService.getBrandById(req.params.id);

        res.status(200).json({
            success: true,
            data: brand,
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

const createBrand = async (req, res) => {
    try {
        const brand = await brandService.createBrand(req.body);

        res.status(201).json({
            success: true,
            message: "Brand created successfully",
            data: brand,
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

const updateBrand = async (req, res) => {
    try {
        const brand = await brandService.updateBrand(
            req.params.id,
            req.body
        );

        res.status(200).json({
            success: true,
            message: "Brand updated successfully",
            data: brand,
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

const deleteBrand = async (req, res) => {
    try {
        const result = await brandService.deleteBrand(req.params.id);

        res.json({
            success: true,
            message: result,
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

module.exports = {
    getBrands,
    getBrandById,
    createBrand,
    updateBrand,
    deleteBrand,
};