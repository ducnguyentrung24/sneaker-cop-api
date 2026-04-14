const Category = require('./category.model');

const getCategories = async (query) => {
    const {
        page = 1,
        limit = 10,
    } = query;

    const offset = (page - 1) * limit;

    const { rows, count } = await Category.findAndCountAll({
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

const getCategoryById = async (id) => {
    const category = await Category.findByPk(id);
    if (!category) {
        throw new Error("Category not found");
    }

    return category;
};

const createCategory = async (data) => {
    const { name } = data;

    const existingCategory = await Category.findOne({ where: { name } });
    if (existingCategory) {
        throw new Error("Category already exists");
    }

    return await Category.create({ name });
};

const updateCategory = async (id, data) => {
    const { name } = data;

    const category = await Category.findByPk(id);
    if (!category) {
        throw new Error("Category not found");
    }

    const exitstingCategory = await Category.findOne({ where: { name } });
    if (exitstingCategory && exitstingCategory.id !== category.id) {
        throw new Error("Category name already exists");
    }

    await category.update({ name });

    return category;
};

const deleteCategory = async (id) => {
    const category = await Category.findByPk(id);
    if (!category) {
        throw new Error("Category not found");
    }

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