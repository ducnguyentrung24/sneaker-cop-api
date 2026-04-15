const productService = require('./product.service');

const getProducts = async (req, res) => {
    try {
        const products = await productService.getProducts(req.query);

        res.status(200).json({
            success: true,
            data: products
        });
    } catch(error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

const getProductById = async (req, res) => {
    try {
        const product = await productService.getProductById(req.params.id);

        res.status(200).json({
            success: true,
            data: product
        });
    } catch(error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

const createProduct = async (req, res) => {
    try {
        const product = await productService.createProduct(req.body);

        res.status(201).json({
            success: true,
            message: "Product created successfully",
            data: product
        });
    } catch(error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

const updateProduct = async (req, res) => {
    try {
        const product = await productService.updateProduct(req.params.id, req.body);

        res.status(200).json({
            success: true,
            message: "Product updated successfully",
            data: product
        });
    } catch(error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

const deleteProduct = async (req, res) => {
    try {
        const result = await productService.deleteProduct(req.params.id);

        res.status(200).json({
            success: true,
            message: result
        });
    } catch(error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
};