const bcrypt = require('bcrypt');

class OrderService {
    constructor(connection) {
        this.connection = connection;        
    }

    extractOrderData(payload) {
        const orderData = {
            user_id: payload.user_id,
            customer_id: payload.customer_id,
            ordered_at: payload.ordered_at,
            name_customer: payload.name_customer,
            phone_customer: payload.phone_customer,
            address_customer: payload.address_customer,
            total_value: payload.total_value,
            status: payload.status,
            details: payload.details
        };
    
        Object.keys(orderData).forEach(key => {
            if (orderData[key] === undefined) {
                delete orderData[key];
            }
        });
    
        return orderData;
    }

    async create(payload) {
        const { user_id, customer_id, ordered_at, name_customer, phone_customer, address_customer, total_value, status, details } = this.extractOrderData(payload);
    
        const order = {
            user_id,
            customer_id,
            ordered_at: new Date(),
            name_customer,
            phone_customer,
            address_customer,
            total_value,
            status: user_id ? "Bán tại cửa hàng" : "Chờ xác nhận"
        };
    
        return new Promise((resolve, reject) => {
            try {
                // Thêm đơn hàng vào bảng orders
                const insertOrderQuery = 'INSERT INTO orders SET ?';
                this.connection.query(insertOrderQuery, order, async (insertOrderError, insertOrderResult) => {
                    if (insertOrderError) {
                        reject(insertOrderError);
                    } else {
                        // Lấy id của đơn hàng vừa thêm vào
                        const orderId = insertOrderResult.insertId;
                        const selectOrderQuery = 'SELECT * FROM orders WHERE id = ?';
                        this.connection.query(selectOrderQuery, [orderId], (orderError, orderResult) => {
                            if (orderError) {
                                reject(orderError);
                            } else {
                                const orderDetails = orderResult[0];
                                // Sau khi lấy thông tin đơn hàng, tiếp tục lấy chi tiết đơn hàng
                                const selectOrderProductQuery = 'SELECT * FROM order_product WHERE order_id = ?';
                                this.connection.query(selectOrderProductQuery, [orderId], (orderProductError, orderProductResult) => {
                                    if (orderProductError) {
                                        reject(orderProductError);
                                    } else {
                                        // Thêm chi tiết đơn hàng vào thông tin đơn hàng
                                        orderDetails.details = orderProductResult;
                                        resolve(orderDetails);
                                    }
                                });
                            }
                        });

                    }
                });
            } catch (error) {
                reject(new Error("Có lỗi khi tạo đơn hàng mới!"));
            }
        });
    }

    async find() {
        return new Promise((resolve, reject) => {
            const query = 'SELECT * FROM orders';
            this.connection.query(query, (error, results) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(results);
                }
            });
        });
    }

    async findById(id) {
        try {
            const result = new Promise((resolve, reject) => {
                const query = `
                    SELECT o.id, o.user_id, o.customer_id, o.ordered_at, o.received_at, o.name_customer, 
                    o.phone_customer, o.address_customer, o.total_value, o.status,
                    op.product_id, op.price, op.quantity
                    FROM orders o
                    INNER JOIN order_product op ON o.id = op.order_id
                    WHERE o.id = ?`;
    
                this.connection.query(query, [id], (error, results) => {
                    if (error) {
                        reject(error);
                    } else {
                        // Tạo một object để chứa thông tin của đơn hàng
                        const order = {
                            id: results[0].id,
                            user_id: results[0].user_id,
                            customer_id: results[0].customer_id,
                            ordered_at: results[0].ordered_at,
                            received_at: results[0].received_at,
                            name_customer: results[0].name_customer,
                            phone_customer: results[0].phone_customer,
                            address_customer: results[0].address_customer,
                            total_value: results[0].total_value,
                            status: results[0].status,
                            details: []
                        };
    
                        // Lặp qua kết quả truy vấn để tạo các chi tiết đơn hàng
                        for (const row of results) {
                            const detail = {
                                product_id: row.product_id,
                                price: row.price,
                                quantity: row.quantity
                            };
                            order.details.push(detail);
                        }
    
                        resolve(order);
                    }
                });
            });
            return result;
        } catch (error) {
            throw new Error("Có lỗi trong quá trình tìm đơn hàng " + id);
        }
    }
    

    async update(id, payload) {
        const { user_id, status } = this.extractOrderData(payload);
        const updateData = {
            user_id,
            status
        };
        return new Promise((resolve, reject) => {
            const updateQuery = 'UPDATE orders SET ? WHERE id = ?';
            this.connection.query(updateQuery, [updateData, id], (error, updateResult) => {
                if (error) {
                    reject(error);
                } else {
                    const selectQuery = 'SELECT * FROM orders WHERE id = ?';
                    this.connection.query(selectQuery, [id], (selectError, selectResult) => {
                        if (selectError) {
                            reject(selectError);
                        } else {
                            const updatedOrder = selectResult[0];
                            resolve(updatedOrder);
                        }
                    });
                }
            });
        });
    }

    async delete(id) {
        return new Promise((resolve, reject) => {
            const now = new Date();
            const updateQuery = 'UPDATE users SET deleted_at = ? WHERE id = ?';
            this.connection.query(updateQuery, [now, id], async (error, updateResult) => {
                if (error) {
                    reject(error);
                } else {
                    // Sau khi cập nhật, thực hiện truy vấn SELECT để lấy thông tin về người dùng đã bị cập nhật
                    const selectQuery = 'SELECT * FROM users WHERE id = ?';
                    this.connection.query(selectQuery, [id], (selectError, selectResult) => {
                        if (selectError) {
                            reject(selectError);
                        } else {
                            // Trả về thông tin người dùng đã bị cập nhật
                            const updatedUser = selectResult[0];
                            resolve(updatedUser);
                        }
                    });
                }
            });
        });
    }
    
}

module.exports = OrderService;
