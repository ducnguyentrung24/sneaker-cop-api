const { Op } = require("sequelize");
const Brand = require("./brand.model");

const getBrands = async (query) => {
    const {
        page = 1,
        limit = 10,
        keyword = "",
    } = query;

    const pageNumber = Number(page) || 1;
    const limitNumber = Number(limit) || 10;
    const offset = (pageNumber - 1) * limitNumber;

    const where = {};
    if (keyword.trim()) {
        where[Op.or] = [
            {
                name: { [Op.iLike]: `%${keyword.trim()}%`},
            },
            {
                description: { [Op.iLike]: `%${keyword.trim()}%` },
            },
        ];
    }

    const { rows, count } = await Brand.findAndCountAll({
        where,
        limit: limitNumber,
        offset,
        order: [['created_at', 'DESC']],
    });

    const totalPages = Math.ceil(count / limitNumber);

    return {
        data: rows,
        pagination: {
            total: count,
            page: pageNumber,
            limit: limitNumber,
            totalPages,
            hasNext: pageNumber < totalPages,
            hasPrev: pageNumber > 1
        },
    };
};

const getBrandById = async (id) => {
    const brand = await Brand.findByPk(id);
    if (!brand) throw new Error("Không tìm thấy thương hiệu");

    return brand;
};

// Admin
const createBrand = async (data) => {
    const { name, description } = data;

    const existingBrand = await Brand.findOne({ where: { name } });
    if (existingBrand) throw new Error("Tên thương hiệu đã tồn tại");

    return await Brand.create({ name, description });
};

const updateBrand = async (id, data) => {
    const { name, description } = data;

    const brand = await Brand.findByPk(id);
    if (!brand) throw new Error("Không tìm thấy thương hiệu");

    const exitstingBrand = await Brand.findOne({ where: { name } });
    if (exitstingBrand && exitstingBrand.id !== brand.id) throw new Error("Tên thương hiệu đã tồn tại");

    await brand.update({ name, description });

    return brand;
};

const deleteBrand = async (id) => {
    const brand = await Brand.findByPk(id);
    if (!brand) throw new Error("Không tìm thấy thương hiệu");

    await brand.destroy();

    return { message: "Xóa thương hiệu thành công" };
};

module.exports = {
    getBrands,
    getBrandById,
    createBrand,
    updateBrand,
    deleteBrand,
};