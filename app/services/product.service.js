class ProductService {
    constructor(connection) {
        this.connection = connection;
    }

    extractUserData(payload) {
        const productData = {
            name: payload.name,
            description: payload.description,
            quantity: payload.quantity,
            stock: payload.stock,
            price_purchase: payload.price_purchase,
            price_sale: payload.price_sale,
            time: payload.time
        };
    
        Object.keys(productData).forEach(key => {
            if (productData[key] === undefined) {
                delete productData[key];
            }
        });
    
        return productData;
    }

    async create(payload) {
        const { name, description, quantity, price_purchase, price_sale, time } = this.extractUserData(payload);
    
        const productData = {
            name,
            description,
            stock: quantity
        };
    
        return new Promise((resolve, reject) => {
            const insertQuery = 'INSERT INTO products SET ?';
            this.connection.query(insertQuery, productData, (error, insertResult) => {
                if (error) {
                    reject(error);
                } else {
                    const productId = insertResult.insertId; // Lấy id của sản phẩm vừa được thêm vào
    
                    // Kiểm tra và thêm thời điểm mới vào bảng moments
                    const checkMomentQuery = 'SELECT * FROM moments WHERE time = ?';
                    this.connection.query(checkMomentQuery, [time], (momentError, momentResult) => {
                        if (momentError) {
                            reject(momentError);
                        } else {
                            if (momentResult.length === 0) {
                                // Thêm thời điểm mới vào bảng moments nếu chưa tồn tại
                                const addMomentQuery = 'INSERT INTO moments (time) VALUES (?)';
                                this.connection.query(addMomentQuery, [time], (addMomentError, addMomentResult) => {
                                    if (addMomentError) {
                                        reject(addMomentError);
                                    }
                                });
                            }
    
                            // Thêm thông tin giá mua và giá bán của sản phẩm vào bảng unit_price
                            const unitPriceData = {
                                product_id: productId,
                                time,
                                price_purchase,
                                price_sale,
                                quantity
                            };
    
                            const unitPriceQuery = 'INSERT INTO unit_price SET ?';
                            this.connection.query(unitPriceQuery, unitPriceData, (unitPriceError, unitPriceResult) => {
                                if (unitPriceError) {
                                    reject(unitPriceError);
                                } else {
                                    // Sau khi thêm giá mua và giá bán thành công, trả về thông tin sản phẩm mới
                                    const selectQuery = 'SELECT * FROM products WHERE id = ?';
                                    this.connection.query(selectQuery, [productId], (selectError, selectResult) => {
                                        if (selectError) {
                                            reject(selectError);
                                        } else {
                                            const newProduct = selectResult[0];
                                            resolve(newProduct);
                                        }
                                    });
                                }
                            });
                        }
                    });
                }
            });
        });
    }
    
    

    async find() {
        return new Promise((resolve, reject) => {
            const query = 'SELECT * FROM products';
            this.connection.query(query, (error, results) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(results);
                }
            });
        });;
    }

    async findById(id) {
        try {
            const result = new Promise((resolve, reject) => {
                const query = `
                    SELECT p.id, p.name, p.description, p.stock, 
                    up.price_purchase, up.price_sale, up.quantity, up.time 
                    FROM products p
                    INNER JOIN unit_price up ON p.id = up.product_id
                    WHERE p.id = ? AND up.time = (
                        SELECT MAX(time) 
                        FROM unit_price 
                        WHERE product_id = p.id
                    )`;
                
                this.connection.query(query, [id], (error, results) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(results[0]);
                    }
                })
            });
            return result;
        } catch (error) {
            throw new Error("Có lỗi trong quá trình tìm sản phẩm " + id);
        }
    }
    

    async update(id, payload) {
        const { name, description, quantity, price_purchase, price_sale, time } = this.extractUserData(payload);
    
        const updateData = {
            name,
            description,
            stock: quantity
        };
        return new Promise((resolve, reject) => {
            const updateQuery = 'UPDATE products SET ? WHERE id = ?';
            this.connection.query(updateQuery, [updateData, id], (error, updateResult) => {
                if (error) {
                    reject(error);
                } else {
                    // Sau khi cập nhật thông tin sản phẩm, tiến hành cập nhật hoặc thêm mới giá và thời điểm
                    const { price_purchase, price_sale, quantity, time } = payload;
                    const unitPriceData = {
                        product_id: id,
                        time,
                        price_purchase,
                        price_sale,
                        quantity
                    };
    
                    // Cập nhật hoặc thêm mới vào bảng unit_price
                    const unitPriceQuery = 'INSERT INTO unit_price SET ? ON DUPLICATE KEY UPDATE price_purchase = VALUES(price_purchase), price_sale = VALUES(price_sale), quantity = VALUES(quantity)';
                    this.connection.query(unitPriceQuery, unitPriceData, (unitPriceError, unitPriceResult) => {
                        if (unitPriceError) {
                            reject(unitPriceError);
                        } else {
                            // Tiến hành cập nhật hoặc thêm mới thời điểm vào bảng moments
                            const momentQuery = 'INSERT INTO moments (time) VALUES (?) ON DUPLICATE KEY UPDATE time = VALUES(time)';
                            this.connection.query(momentQuery, [time], (momentError, momentResult) => {
                                if (momentError) {
                                    reject(momentError);
                                } else {
                                    // Trả về thông tin sản phẩm sau khi cập nhật
                                    const selectQuery = 'SELECT * FROM products WHERE id = ?';
                                    this.connection.query(selectQuery, [id], (selectError, selectResult) => {
                                        if (selectError) {
                                            reject(selectError);
                                        } else {
                                            const updatedProduct = selectResult[0];
                                            resolve(updatedProduct);
                                        }
                                    });
                                }
                            });
                        }
                    });
                }
            });
        });
    }

    async delete(id) {
        return new Promise((resolve, reject) => {
            const now = new Date();
            const updateQuery = 'UPDATE products SET deleted_at = ? WHERE id = ?';
            this.connection.query(updateQuery, [now, id], async (error, updateResult) => {
                if (error) {
                    reject(error);
                } else {
                    // Sau khi cập nhật, thực hiện truy vấn SELECT để lấy thông tin về người dùng đã bị cập nhật
                    const selectQuery = 'SELECT * FROM products WHERE id = ?';
                    this.connection.query(selectQuery, [id], (selectError, selectResult) => {
                        if (selectError) {
                            reject(selectError);
                        } else {
                            // Trả về thông tin người dùng đã bị cập nhật
                            const updatedProduct = selectResult[0];
                            resolve(updatedProduct);
                        }
                    });
                }
            });
        });
    }
    
}

module.exports = ProductService;
