const UserService = require("../services/user.service");
const MySQL = require("../utils/mysql.util");
const ApiError = require("../api-error");
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

exports.create = async(req, res, next) => {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
        return next(new ApiError(400, "Các trường không được bỏ trống"));
    }

    try {
        const userService = new UserService(MySQL.connection);
        const user_existed = await userService.findByEmail(email);
        if(user_existed)
            return next(new ApiError(404, "Người dùng đã tồn tại!"));
        else {
            const newUser = await userService.create(req.body);
            return res.send(newUser);
        }

    } catch (error) {
        return next(
            new ApiError(500, error)
        );
    }
};

exports.findAll = async(req, res, next) => {
    let documents = [];

    try {
        const userService = new UserService(MySQL.connection);
        documents = await userService.find();
    } catch (error) {
        return next( 
            new ApiError(500, error)
        );
    }

    return res.send(documents);
};

exports.findOne = async(req, res, next) => {
    try {
        const userService = new UserService(MySQL.connection);
        const document = await userService.findById(req.params.id);
        if (!document) {
            return next(new ApiError(404, "Không tìm thấy người dùng."));
        }
        return res.send(document);
    } catch (error) {
        return next(
            new ApiError(
                500,
                `Có lỗi xảy ra khi tìm người dùng có id=${req.params.id}`
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
        const userService = new UserService(MySQL.connection);
        const user_existed = await userService.findById(req.params.id);
        if (!user_existed) {
            return next(new ApiError(404, "Không tìm thấy người dùng."));
        }
        const result = await userService.update(req.params.id, req.body);
        return res.send(result);
    } catch (error) {
        return next(
            new ApiError(error)
        );
    }
};

exports.login = async (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return next(new ApiError(400, "Email và mật khẩu là bắt buộc."));
    }

    try {
        const userService = new UserService(MySQL.connection);
        const user = await userService.findByEmail(email);
        if (!user) {
            return next(new ApiError(404, "Người dùng không tồn tại."));
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (isPasswordValid) {
            const token = jwt.sign({ userId: user.id }, 'your_secret_key', { expiresIn: '1d' });
            const role = user.role;
            const expiryDate = new Date(new Date().getTime() + 24 * 3600 * 1000); // Thêm 1 ngày
            return res.json({ "token": token, "userId": user.id, "role": role, "expiryDate": expiryDate}); 
        } else {
            return res.status(401).json({ message: "Email hoặc mật khẩu không hợp lệ." });
        }
    } catch (error) {
        return next(
            new ApiError(
                500,
                `Lỗi đăng nhập với email = ${email}`
            )
        );
    }
};


exports.getUserInfoFromToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: "Token chưa được cung cấp" });
    }

    try {
        const decoded = jwt.verify(token, 'your_secret_key');
        const userId = decoded.userId;

        const userService = new UserService(MySQL.connection);
        const user = await userService.findById(userId);

        if (!user) {
            return res.status(404).json({ message: "Không tìm thấy người dùng." });
        }

        return res.json({ "token": token, "user": user });
    } catch (error) {
        return res.status(401).json({ message: "Token không hợp lệ." });
    }
};

exports.delete = async(req, res, next) => {
    try {
        const userService = new UserService(MySQL.connection);
        const document = await userService.delete(req.params.id);
        if (!document) {
            return next(new ApiError(404, "Không tìm thấy người dùng"));
        }
        return res.send({ message: "Người dùng được xóa thành công" });
    } catch (error) {
        return next(
            new ApiError(
                500,
                `Không thể xóa người dùng với id=${req.params.id}`
            )
        );
    }
};

exports.findAllSale = async(req, res, next) => {
    let documents = [];

    try {
        const userService = new UserService(MySQL.connection);
        documents = await userService.findBySale();
    } catch (error) {
        return next( 
            new ApiError(500, "Xảy ra lỗi trong quá trình lấy người dùng")
        );
    }

    return res.send(documents);
};