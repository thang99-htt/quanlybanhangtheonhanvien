const ProductService = require("../services/product.service");
const MySQL = require("../utils/mysql.util");
const ApiError = require("../api-error");

exports.create = async(req, res, next) => {
    const { name, description, quantity, price_purchase, price_sale } = req.body;

    if (!name || !description || !quantity || !price_purchase, !price_sale) {
        return next(new ApiError(400, "Các trường không được bỏ trống"));
    }

    try {
        const productService = new ProductService(MySQL.connection);
        const document = await productService.create(req.body);
        return res.send(document);

    } catch (error) {
        return next(error);
    }
};

exports.findAll = async(req, res, next) => {
    let documents = [];

    try {
        const productService = new ProductService(MySQL.connection);
        documents = await productService.find();
    } catch (error) {
        return next( 
            new ApiError(500, "Xảy ra lỗi trong quá trình lấy sản phẩm")
        );
    }

    return res.send(documents);
};

exports.findOne = async(req, res, next) => {
    try {
        const productService = new ProductService(MySQL.connection);
        const document = await productService.findById(req.params.id);
        if (!document) {
            return next(new ApiError(404, "Không tìm thấy sản phẩm"));
        }
        return res.send(document);
    } catch (error) {
        return next(
            new ApiError(
                500,
                `Có lỗi xảy ra khi tìm sản phẩm có id=${req.params.id}`
            )
        );
    }
};

exports.update = async(req, res, next) => {
    if (Object.keys(req.body).length === 0) {
        return next(new ApiError(
            400, "Dữ liệu update không được rỗng.")
        );
    }
    try {
        const productService = new ProductService(MySQL.connection);
        const product_existed = await productService.findById(req.params.id);
        if (!product_existed) {
            return next(new ApiError(404, "Không tìm thấy sản phẩm."));
        }
        const result = await productService.update(req.params.id, req.body);
        return res.send(result);
    } catch (error) {
        return next(
            new ApiError(error)
        );
    }
};

exports.delete = async(req, res, next) => {
    try {
        const productService = new ProductService(MySQL.connection);
        const document = await productService.delete(req.params.id);
        if (!document) {
            return next(new ApiError(404, "Không tìm thấy sản phẩm"));
        }
        return res.send({ message: "Sản phẩm được xóa thành công" });
    } catch (error) {
        return next(
            new ApiError(error)
        );
    }
};
