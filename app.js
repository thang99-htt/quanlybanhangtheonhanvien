const express = require("express");
const cors = require("cors");

const usersRouter = require("./app/routes/user.route");
const productsRouter = require("./app/routes/product.route");
const ordersRouter = require("./app/routes/order.route");
const revenuesRouter = require("./app/routes/revenue.route");

const ApiError = require("./app/api-error");

const app = express();


app.use(cors());
app.use(express.json());

app.use("/api/users", usersRouter);
app.use("/api/products", productsRouter);
app.use("/api/orders", ordersRouter);
app.use("/api/revenues", revenuesRouter);

app.get("/", (req, res) => {
    res.json({ message: "Quản lý bán hàng theo Nhân viên."});
});

// handle 404 response
app.use((req, res, next) => {
    return next(new ApiError(404, "Resource not found"));
});
    
// define error-handling middleware last, after other app.use() and routes calls
app.use((error, req, res, next) => {
    return res.status(error.statusCode || 500).json({
        message: error.message || "Internal Server Error",
    });
});

module.exports = app;