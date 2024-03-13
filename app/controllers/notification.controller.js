const NotificationService = require("../services/notification.service");
const MySQL = require("../utils/mysql.util");
const ApiError = require("../api-error");

exports.create = async(req, res, next) => {
    try {
        const notificationService = new NotificationService(MySQL.connection);
        const notification = await notificationService.create(req.body);
        return res.send(notification);
    } catch (error) {
        return next(
            new ApiError(500, error)
        );
    }
};

exports.findAll = async(req, res, next) => {
    let documents = [];

    try {
        const notificationService = new NotificationService(MySQL.connection);
        documents = await notificationService.find();
    } catch (error) {
        return next( 
            new ApiError(500, "Xảy ra lỗi trong quá trình lấy thông báo")
        );
    }

    return res.send(documents);
};

exports.findOne = async(req, res, next) => {
    let documents = [];

    try {
        const notificationService = new NotificationService(MySQL.connection);
        documents = await notificationService.findById(req.params.id);
    } catch (error) {
        return next( 
            new ApiError(500, "Xảy ra lỗi trong quá trình lấy thông báo")
        );
    }

    return res.send(documents);
};

exports.updateReaded = async(req, res, next) => {
    let documents = [];

    try {
        const notificationService = new NotificationService(MySQL.connection);
        documents = await notificationService.updateReaded(req.params.id);
    } catch (error) {
        return next( 
            new ApiError(500, "Xảy ra lỗi trong quá trình lấy thông báo")
        );
    }

    return res.send(documents);
};
