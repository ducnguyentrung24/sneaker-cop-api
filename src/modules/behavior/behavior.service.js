const Behavior = require('./behavior.model');

const { behaviorTypes } = require('../../constants/behavior.constant');

const caculateScore = (behavior) => {
    return behavior.view_count + behavior.cart_count * 3 + behavior.purchase_count * 5
};

const trackBehavior = async (userId, productId, type) => {
    if (!userId || !productId) return;

    const [behavior] = await Behavior.findOrCreate({
        where: {
            user_id: userId,
            product_id: productId,
        },
        defaults: {
            user_id: userId,
            product_id: productId,
            view_count: 0,
            cart_count: 0,
            purchase_count: 0,
            score: 0,
        }
    });

    if (type === behaviorTypes.VIEW) behavior.view_count += 1;
    if (type === behaviorTypes.CART) behavior.cart_count += 1;
    if (type === behaviorTypes.PURCHASE) behavior.purchase_count += 1;

    behavior.score = caculateScore(behavior);

    await behavior.save();

    return behavior;
};

module.exports = {
    trackBehavior,
};