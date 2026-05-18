const { orderStatus } = require('./orderStatus.constant');

const ORDER_FLOW = {
    [orderStatus.PENDING]: [
        orderStatus.PROCESSING,
        orderStatus.CANCELLED,
    ],
    [orderStatus.PROCESSING]: [
        orderStatus.SHIPPING,
        orderStatus.CANCELLED,
    ],
    [orderStatus.SHIPPING]: [
        orderStatus.COMPLETED,
        orderStatus.CANCELLED,
    ],
    [orderStatus.COMPLETED]: [],
    [orderStatus.CANCELLED]: [],
};

module.exports = {
    ORDER_FLOW,
};