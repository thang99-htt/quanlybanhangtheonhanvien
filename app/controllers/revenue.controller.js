const RevenueService = require("../services/revenue.service");
const MySQL = require("../utils/mysql.util");
const ApiError = require("../api-error");

exports.findOne = async(req, res, next) => {
    try {
        const revenueService = new RevenueService(MySQL.connection);
        const document = await revenueService.findById(req.params.id);
        if (!document) {
            return next(new ApiError(404, "Không tìm thấy doanh thu."));
        }
        return res.send(document);
    } catch (error) {
        return next(
            new ApiError(
                500,
                error
            )
        );
    }
};

