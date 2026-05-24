const { Op } = require('sequelize');
const Category = require('./category.model');
const Product = require('../product/product.model');

const getCategories = async (query) => {
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

    const { rows, count } = await Category.findAndCountAll({
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

const getCategoryById = async (id) => {
    const category = await Category.findByPk(id);
    if (!category) throw new Error("Category not found");

    return category;
};

// Admin
const createCategory = async (data) => {
    const { name, description } = data;

    const existingCategory = await Category.findOne({ where: { name } });
    if (existingCategory) throw new Error("Category already exists");

    return await Category.create({ name, description });
};

const updateCategory = async (id, data) => {
    const { name, description } = data;

    const category = await Category.findByPk(id);
    if (!category) throw new Error("Category not found");

    const exitstingCategory = await Category.findOne({ where: { name } });
    if (exitstingCategory && exitstingCategory.id !== category.id) throw new Error("Category name already exists");

    await category.update({ name, description });

    return category;
};

const deleteCategory = async (id) => {
    const category = await Category.findByPk(id);
    if (!category) throw new Error("Category not found");

    await category.destroy();

    return { message: "Category deleted successfully" };
};

module.exports = {
    getCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory,
};