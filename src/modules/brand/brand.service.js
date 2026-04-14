const Brand = require("./brand.model");

const getBrands = async (query) => {
    const {
        page = 1,
        limit = 10,
    } = query;

    const offset = (page - 1) * limit;

    const { rows, count } = await Brand.findAndCountAll({
        limit: Number(limit),
        offset: Number(offset),
        order: [['created_at', 'DESC']],
    });

    return {
        data: rows,
        pagination: {
            total: count,
            page: Number(page),
            limit: Number(limit),
            totalPages: Math.ceil(count / limit),
        },
    };
};

const getBrandById = async (id) => {
    const brand = await Brand.findByPk(id);
    if (!brand) {
        throw new Error("Brand not found");
    }

    return brand;
};

const createBrand = async (data) => {
    const { name } = data;

    const existingBrand = await Brand.findOne({ where: { name } });
    if (existingBrand) {
        throw new Error("Brand already exists");
    }

    return await Brand.create({ 
        name 
    });
};

const updateBrand = async (id, data) => {
    const { name } = data;

    const brand = await Brand.findByPk(id);
    if (!brand) {
        throw new Error("Brand not found");
    }

    const exitstingBrand = await Brand.findOne({ where: { name: data.name } });
    if (exitstingBrand && exitstingBrand.id !== brand.id) {
        throw new Error("Brand name already exists");
    }

    await brand.update({ name });

    return brand;
};

const deleteBrand = async (id) => {
    const brand = await Brand.findByPk(id);
    if (!brand) {
        throw new Error("Brand not found");
    }

    await brand.destroy();

    return { message: "Brand deleted successfully" };
};

module.exports = {
    getBrands,
    getBrandById,
    createBrand,
    updateBrand,
    deleteBrand,
};