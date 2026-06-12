const { sequelize } = require("../../models");

const Cart = require("./cart.model");
const CartItem = require("./cartItem.model");
const ProductVariant = require("../product/productVariant.model");
const Product = require("../product/product.model");

const behaviorService = require("../behavior/behavior.service");
const { behaviorTypes } = require('../../constants/behavior.constant');

const getCart = async (userId) => {
    // Get cart with items and product details
    const cart = await Cart.findOne({
        where: { user_id: userId },
        include: [
            {
                model: CartItem,
                as: 'items',
                include: [
                    {
                        model: ProductVariant,
                        as: 'variant',
                        include: [
                            {
                                model: Product,
                                as: 'product',
                            }
                        ]
                    }   
                ]
            }
        ]
    });

    // Check cart exists
    if (!cart) {
        return {
            items: [],
            total_price: 0
        };
    }

    // 3. Format data
    let totalPrice = 0;

    const items = cart.items.map(item => {
        const variant = item.variant;
        const product = variant.product;

        // Tính tiền (đã trừ discount)
        const variantPrice = Number(variant.price);
        const discount = Number(product.discount_percent) || 0;
        const finalPrice = variantPrice * (1 - discount / 100);

        const quantity = item.quantity;
        const total = finalPrice * quantity;
        totalPrice += total;

        return {
            id: item.id,
            quantity,
            price: finalPrice,
            original_price: variantPrice,
            total,

            product: {
                id: product.id,
                name: product.name,
                thumbnail: product.thumbnail,
                discount_percent: discount
            },

            variant: {
                id: variant.id,
                color: variant.color,
                size: variant.size,
                stock: variant.stock,
                image_url: variant.image_url
            }
        };
    });

    return {
        items,
        total_price: totalPrice
    };
};

const addToCart = async (userId, data) => {
    return await sequelize.transaction(async (transaction) => {
        const { variant_id, quantity } = data;
        if (!variant_id || !quantity) throw new Error("variant_id and quantity are required");

        // Check variant exists
        const variant = await ProductVariant.findByPk(variant_id, { transaction });
        if (!variant) {
            throw new Error("Khong tìm thấy biến thể sản phẩm");
        }

        // Get or create cart
        let cart = await Cart.findOne({
            where: { user_id: userId },
            transaction
        });

        if (!cart) cart = await Cart.create({ user_id: userId }, { transaction });

        // Check item already in cart
        let cartItem = await CartItem.findOne({
            where: {
                cart_id: cart.id,
                product_variant_id: variant_id
            },
            transaction
        });

        // 4. If exists, update quantity
        if (cartItem) {
            const newQuantity = cartItem.quantity + quantity;

            // Check stock
            if (newQuantity > variant.stock) throw new Error("Số lượng vượt quá tồn kho");

            await cartItem.update(
                { quantity: newQuantity },
                { transaction }
            );
        } else {
            // Check stock
            if (quantity > variant.stock) throw new Error("Số lượng vượt quá tồn kho");

            // Create new cart item
            cartItem = await CartItem.create({
                cart_id: cart.id,
                product_variant_id: variant_id,
                quantity
            }, { transaction});
        }

        // Track behavior to cart behavior
        await behaviorService.trackBehavior(
            userId,
            variant.product_id,
            behaviorTypes.CART
        );
        
        return cartItem;
    });
};

const updateQuantity = async (userId, cartItemId, data) => {
    const { quantity } = data;
    if (!quantity || quantity < 1) throw new Error("Số lượng ít nhất phải là 1");

    const cartItem = await CartItem.findByPk(cartItemId, {
        include: [
            {
                model: Cart
            },
            {
                model: ProductVariant,
                as: 'variant',
            }
        ]
    });

    if (!cartItem) throw new Error("Không tìm thấy mục giỏ hàng");
    if (cartItem.Cart.user_id !== userId) throw new Error("Unauthorized");
    // Check stock
    const currentQuantity = cartItem.quantity;
    if (quantity > currentQuantity && quantity > cartItem.variant.stock) throw new Error("Số lượng vượt quá tồn kho");

    // Update quantity
    await cartItem.update({ quantity });

    return cartItem;
};

const deleteCartItem = async (userId, cartItemId) => {
    const cartItem = await CartItem.findByPk(cartItemId, {
        include: [
            {
                model: Cart
            }
        ]
    });

    if (!cartItem) throw new Error("Không tìm thấy sản phẩm trong giỏ hàng");
    if (cartItem.Cart.user_id !== userId) throw new Error("Unauthorized");

    await cartItem.destroy();

    return { message: "Xóa sản phẩm khỏi giỏ hàng thành công" };
};

const deleteManyCartItems = async (userId, cartItemIds) => {
    if (!Array.isArray(cartItemIds) || cartItemIds.length === 0) {
        throw new Error("cartItemIds must be a non-empty array");
    }

    return await sequelize.transaction(async (transaction) => {
        const cartItems = await CartItem.findAll({
            where: {
                id: cartItemIds
            },
            include: [
                {
                    model: Cart
                }
            ],
            transaction
        });

        if (!cartItems.length) throw new Error("Không tìm thấy sản phẩm trong giỏ hàng");

        for (const item of cartItems) {
            if (item.Cart.user_id !== userId) throw new Error("Unauthorized");
        }

        await CartItem.destroy({
            where: {
                id: cartItemIds
            },
            transaction
        });

        return {
            deletedCount: cartItemIds.length
        };
    });
};

module.exports = {
    getCart,
    addToCart,
    updateQuantity,
    deleteCartItem,
    deleteManyCartItems,
};