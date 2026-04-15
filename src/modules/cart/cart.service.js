const { sequelize } = require("../../models");

const Cart = require("./cart.model");
const CartItem = require("./cartItem.model");
const ProductVariant = require("../product/productVariant.model");
const Product = require("../product/product.model");

const getCart = async (userId) => {
    // 1. Get cart + join full
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

    // 2. If no cart, return empty
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

        // Trước giảm giá
        const variantPrice = Number(variant.price);
        const discount = Number(product.discount_percent) || 0;

        // Sau giảm giá
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

        if (!variant_id || !quantity) {
            throw new Error("variant_id and quantity are required");
        }

        // 1. Check variant exists
        const variant = await ProductVariant.findByPk(variant_id, { transaction });
        if (!variant) {
            throw new Error("Product variant not found");
        }

        // 2. Get or create cart
        let cart = await Cart.findOne({
            where: { user_id: userId },
            transaction
        });

        if (!cart) {
            cart = await Cart.create({ user_id: userId }, { transaction });
        }

        // 3.Check item already in cart
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
            if (newQuantity > variant.stock) {
                throw new Error("Quantity exceeds available stock");
            }

            await cartItem.update(
                { quantity: newQuantity },
                { transaction }
            );
        } else {
            // Check stock
            if (quantity > variant.stock) {
                throw new Error("Quantity exceeds available stock");
            }

            // Create new cart item
            cartItem = await CartItem.create({
                cart_id: cart.id,
                product_variant_id: variant_id,
                quantity
            }, { transaction});
        }

        return cartItem;
    });
};

module.exports = {
    getCart,
    addToCart,
};