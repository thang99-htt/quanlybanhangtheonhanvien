const bcrypt = require('bcrypt');

class UserService {
    constructor(connection) {
        this.connection = connection;        
    }

    extractUserData(payload) {
        const userData = {
            name: payload.name,
            manager_id: payload.manager_id,
            email: payload.email,
            password: payload.password,
            position: payload.position,
            presenter: payload.presenter
        };
    
        Object.keys(userData).forEach(key => {
            if (userData[key] === undefined) {
                delete userData[key];
            }
        });
    
        return userData;
    }

    async findByEmail(email) {
        try {
            const result = new Promise((resolve, reject) => {
                const query = 'SELECT * FROM users WHERE email = ?';
                this.connection.query(query, [email], (error, results) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(results[0]);
                    }
                })
            });
            return result;

        } catch (error) {
            throw new Error("Có lỗi trong quá trình tìm người dùng có email " + email);
        }
    }

    async create(payload) {
        const { name, email, password, position, presenter, manager_id } = this.extractUserData(payload);

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = {
            name,
            manager_id,
            email,
            password: hashedPassword,
            position,
            presenter
        };

        try {
            const query = 'INSERT INTO users SET ?';
            await this.connection.query(query, user);
            return await this.findByEmail(email);

        } catch (error) {
            throw new Error("Có lỗi khi tạo người dùng mới!");
        }
    }

    async find() {
        return new Promise((resolve, reject) => {
            const query = 'SELECT * FROM users';
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
                const query = 'SELECT * FROM users WHERE id = ?';
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
            throw new Error("Có lỗi trong quá trình tìm người dùng có email " + id);
        }
    } 

    async update(id, payload) {
        const updateData = this.extractUserData(payload);
        return new Promise((resolve, reject) => {
            const updateQuery = 'UPDATE users SET ? WHERE id = ?';
            this.connection.query(updateQuery, [updateData, id], (error, updateResult) => {
                if (error) {
                    reject(error);
                } else {
                    const selectQuery = 'SELECT * FROM users WHERE id = ?';
                    this.connection.query(selectQuery, [id], (selectError, selectResult) => {
                        if (selectError) {
                            reject(selectError);
                        } else {
                            // Lấy người dùng đã được cập nhật từ kết quả truy vấn SELECT
                            const updatedUser = selectResult[0];
                            resolve(updatedUser);
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

module.exports = UserService;
