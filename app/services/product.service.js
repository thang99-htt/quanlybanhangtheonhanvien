class ProductService {
    constructor(connection) {
        this.connection = connection;
    }

    extractUserData(payload) {
        const productData = {
            name: payload.name,
            description: payload.description,
            stock: payload.stock,
            price_purchase: payload.price_purchase,
            time_purchase: payload.time_purchase,
            quantity: payload.quantity,
            price_sale: payload.price_sale,
            time_slae: payload.time_sale,
            image: payload.image
        };
    
        Object.keys(productData).forEach(key => {
            if (productData[key] === undefined) {
                delete productData[key];
            }
        });
    
        return productData;
    }

    async create(payload) {
        const { name, image, description } = this.extractUserData(payload);
    
        const productData = {
            name,
            description,
            stock: 0,
            image,
        };
    
        return new Promise((resolve, reject) => {
            const insertQuery = 'INSERT INTO products SET ?';
            this.connection.query(insertQuery, productData, (error, insertResult) => {
                if (error) {
                    reject(error);
                } else {
                    const newProduct = insertResult[0];
                    resolve(newProduct);
                }
            });
        });
    }

    async find() {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT 
                    p.id,
                    p.name,
                    p.description,
                    p.image,
                    p.stock,
                    upr.time AS time_purchase,
                    upr.price_purchase AS price_purchase,
                    upr.quantity AS quantity_purchase,
                    ubs.product_id,
                    ubs.time AS time_sale,
                    ubs.price_sale AS price_sale,
                    ubs.checked AS checked
                FROM
                    products p
                LEFT JOIN unit_price_purchase upr ON p.id = upr.product_id
                LEFT JOIN unit_price_sale ubs ON p.id = ubs.product_id
                
                    
            `;
            this.connection.query(query, (error, results) => {
                if (error) {
                    reject(error);
                } else {
                    // Tạo mảng để chứa sản phẩm và giá mua/bán của nó
                    const productsWithPrices = {};
    
                    // Lặp qua kết quả từ câu truy vấn SQL
                    results.forEach(async row => {
                        const productId = row.id;
    
                        // Nếu sản phẩm chưa tồn tại trong mảng, thêm vào
                        if (!productsWithPrices[productId]) {
                            productsWithPrices[productId] = {
                                id: row.id,
                                name: row.name,
                                description: row.description,
                                image: row.image,
                                stock: row.stock,
                                purchasesInfo: [],
                                salesInfo: [],
                                time_sale: null, // Mặc định là null
                                price_sale: null 
                            };
                        }

                        if (row.checked === 1) {
                            if (row.time_sale && row.price_sale) {
                                productsWithPrices[productId].time_sale = row.time_sale;
                                productsWithPrices[productId].price_sale = row.price_sale;
                            }
                        }
    
                        // Thêm giá mua/bán vào mảng giá của sản phẩm
                        if (row.time_purchase && row.price_purchase) {
                            const rowTime = new Date(row.time_purchase);
                            const existingPurchase = productsWithPrices[productId].purchasesInfo.find(purchase => {
                                const purchaseTime = new Date(purchase.time);
                                return purchaseTime.getTime() === rowTime.getTime() &&
                                    purchase.price === row.price_purchase &&
                                    purchase.quantity === row.quantity_purchase;
                            });
                            if (!existingPurchase) {
                                productsWithPrices[productId].purchasesInfo.push({
                                    time: row.time_purchase,
                                    price: row.price_purchase,
                                    quantity: row.quantity_purchase
                                });
                            }
                        }
    
                        if (row.time_sale && row.price_sale) {
                            const rowTime = new Date(row.time_sale);
                            const existingSale = productsWithPrices[productId].salesInfo.find(sale => {
                                const saleTime = new Date(sale.time);
                                return saleTime.getTime() === rowTime.getTime() &&
                                    sale.price === row.price_sale &&
                                    sale.quantity === row.quantity_sale;
                            });
                            if (!existingSale) {
                                productsWithPrices[productId].salesInfo.push({
                                    product_id: row.product_id,
                                    time: row.time_sale,
                                    price: row.price_sale,
                                    checked: row.checked,
                                });
                            }
                        }

                        
                    });
    
                    Object.values(productsWithPrices).forEach(product => {
                        product.purchasesInfo.reverse();
                        product.salesInfo.reverse();
                    });
        
                    const productsArray = Object.values(productsWithPrices).reverse();
                    resolve(productsArray);
    
                    resolve(productsArray);
                }
            });
        });
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
        const { name, description, image } = this.extractUserData(payload);
    
        const updateData = {
            name,
            description,
            image: image
        };
    
        return new Promise((resolve, reject) => {
            const updateQuery = 'UPDATE products SET ? WHERE id = ?';
            this.connection.query(updateQuery, [updateData, id], (error, updateResult) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(updateResult);
                }
            });
        });
    }
    
    async updatePricePurchase(id, payload) {
        const updateData = {
            time: payload.time,
            price_purchase: payload.price,
            quantity: payload.quantity,
            product_id: id
        };
    
        return new Promise((resolve, reject) => {
            const checkPriceQuery = 'SELECT * FROM unit_price_purchase WHERE price_purchase = ? AND time = ? AND product_id = ? LIMIT 1';
            this.connection.query(checkPriceQuery, [payload.price, payload.time, id], (error, results) => {
                if (error) {
                    reject(error);
                } else if (results.length == 0) {
                    const checkTimeQuery = 'SELECT * FROM moments WHERE time = ? LIMIT 1';
                    this.connection.query(checkTimeQuery, [payload.time], (error, timeResults) => {
                        if (error) {
                            reject(error);
                        } else if (timeResults.length == 0) {
                            const insertTimeQuery = 'INSERT INTO moments (time) VALUES (?)';
                            this.connection.query(insertTimeQuery, [payload.time], (error, insertResult) => {
                                if (error) {
                                    reject(error);
                                } else {
                                    insertPricePurchase(updateData, resolve, reject);
                                }
                            });
                        } else {
                            insertPricePurchase(updateData, resolve, reject);
                        }
                    });
                } else {
                    resolve({ message: 'Price already exists for the given time, product, and price.' });
                }
            });
            const insertPricePurchase = (updateData, resolve, reject) => {
                const insertQuery = 'INSERT INTO unit_price_purchase SET ?';
                this.connection.query(insertQuery, updateData, (error, insertResult) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(insertResult);
                    }
                });
            };
        });
    }
 
    async updatePriceSale(id, payload) {
        const updateData = {
            time: payload.time,
            price_sale: payload.price,
            product_id: id,
            checked: 1
        };
    
        return new Promise((resolve, reject) => {
            const checkPriceQuery = 'SELECT * FROM unit_price_sale WHERE price_sale = ? AND time = ? AND product_id = ? LIMIT 1';
            this.connection.query(checkPriceQuery, [payload.price, payload.time, id], (error, results) => {
                if (error) {
                    reject(error);
                } else if (results.length == 0) {
                    const checkTimeQuery = 'SELECT * FROM moments WHERE time = ? LIMIT 1';
                    this.connection.query(checkTimeQuery, [payload.time], (error, timeResults) => {
                        if (error) {
                            reject(error);
                        } else if (timeResults.length == 0) {
                            const insertTimeQuery = 'INSERT INTO moments (time) VALUES (?)';
                            this.connection.query(insertTimeQuery, [payload.time], (error, insertResult) => {
                                if (error) {
                                    reject(error);
                                } else {
                                    insertPriceSale(updateData, resolve, reject); 
                                }
                            });
                        } else {
                            insertPriceSale(updateData, resolve, reject); 
                        }
                    });
                } else {
                    resolve({ message: 'Price already exists for the given time, product, and price.' });
                }
            });
    
            const insertPriceSale = (updateData, resolve, reject) => { 
                const checkDuplicateQuery = 'SELECT * FROM unit_price_sale WHERE product_id = ? AND time = ? LIMIT 1';
                this.connection.query(checkDuplicateQuery, [updateData.product_id, updateData.time], (error, results) => {
                    if (error) {
                        reject(error);
                    } else if (results.length > 0) {
                        resolve({ message: 'Unit price sale already exists for the given product and time.' });
                    } else {
                        // Update other entries with checked = 0
                        const updateExistingQuery = 'UPDATE unit_price_sale SET checked = 0 WHERE product_id = ? AND checked = 1';
                        this.connection.query(updateExistingQuery, [updateData.product_id], (error, updateResult) => {
                            if (error) {
                                reject(error);
                            } else {
                                // Insert the new entry
                                const insertQuery = 'INSERT INTO unit_price_sale SET ?';
                                this.connection.query(insertQuery, updateData, (error, insertResult) => {
                                    if (error) {
                                        reject(error);
                                    } else {
                                        resolve(insertResult);
                                    }
                                });
                            }
                        });
                    }
                });
            };
        });
    }
    
    async updateChecked(payload) {
        const updateData = {
            product_id: payload.product_id,
            time: new Date(payload.time).toISOString().slice(0, 19).replace('T', ' '), // Format datetime
            price: payload.price,
            checked: 1
        };
    
        return new Promise((resolve, reject) => {
            const checkPriceQuery = 'SELECT * FROM unit_price_sale WHERE price_sale = ? AND time = ? AND product_id = ? LIMIT 1';
            this.connection.query(checkPriceQuery, [payload.price, updateData.time, payload.product_id], (error, results) => {
                if (error) {
                    reject(error);
                } else {
                    const updateExistingQuery = 'UPDATE unit_price_sale SET checked = 0 WHERE product_id = ? AND checked = 1';
                    this.connection.query(updateExistingQuery, [updateData.product_id], (error, updateResult) => {
                        if (error) {
                            reject(error);
                        } else {
                            const insertQuery = 'UPDATE unit_price_sale SET checked = 1 WHERE product_id = ? AND time = ? AND price_sale = ?';
                            this.connection.query(insertQuery, [updateData.product_id, updateData.time, updateData.price], (error, insertResult) => {
                                if (error) {
                                    reject(error);
                                } else {
                                    resolve(insertResult);
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
