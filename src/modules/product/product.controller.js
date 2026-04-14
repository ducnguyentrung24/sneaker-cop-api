const productService = require('./product.service');

const createProduct = async (req, res) => {
    try {
        const product = await productService.createProudct(req.body);

        res.status(201).json({
            success: true,
            message: "Product created successfully",
            data: product,
        });
    } catch(error) {
        res.status(400).json({
            success: false,
            error: error.message,
        });
    }
};

module.exports = {
    createProduct,
};