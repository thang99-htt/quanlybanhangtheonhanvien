const OrderService = require("../services/order.service");
const MySQL = require("../utils/mysql.util");
const ApiError = require("../api-error");

exports.create = async(req, res, next) => {
    const { name_customer, phone_customer } = req.body;

    if (!name_customer || !phone_customer) {
        return next(new ApiError(400, "Các trường không được bỏ trống"));
    }

    try {
        const orderService = new OrderService(MySQL.connection);
        const order = await orderService.create(req.body);
        return res.send(order);
    } catch (error) {
        return next(
            new ApiError(500, error)
        );
    }
};

exports.findAll = async(req, res, next) => {
    let documents = [];

    try {
        const orderService = new OrderService(MySQL.connection);
        documents = await orderService.find();
    } catch (error) {
        return next( 
            new ApiError(500, "Xảy ra lỗi trong quá trình lấy đơn hàng")
        );
    }

    return res.send(documents);
};

exports.findOne = async(req, res, next) => {
    try {
        const orderService = new OrderService(MySQL.connection);
        const document = await orderService.findById(req.params.id);
        if (!document) {
            return next(new ApiError(404, "Không tìm thấy đơn hàng."));
        }
        return res.send(document);
    } catch (error) {
        return next(
            new ApiError(
                500,
                `Có lỗi xảy ra khi tìm đơn hàng có id=${req.params.id}`
            )
        );
    }
};

exports.update = async(req, res, next) => {
    try {
        const orderService = new OrderService(MySQL.connection);
        const product_existed = await orderService.findById(req.params.id);
        if (!product_existed) {
            return next(new ApiError(404, "Không tìm thấy đơn hàng."));
        }
        const result = await orderService.update(req.params.id, req.body);
        return res.send(result);
    } catch (error) {
        return next(
            new ApiError(error)
        );
    }
};

