class RevenueService {
    constructor(connection) {
        this.connection = connection;        
    }

    async findById(id) {
        try {
            const result = new Promise((resolve, reject) => {
                const userQuery = 'SELECT id, name, email, position, presenter, manager_id FROM users WHERE id = ?';
                this.connection.query(userQuery, [id], (userError, userResult) => {
                    if (userError) {
                        reject(userError);
                    } else {
                        const user = userResult[0]; // Lấy người dùng từ kết quả truy vấn
    
                        const subordinatesQuery = `
                            WITH RECURSIVE Subordinates AS (
                                SELECT id, name, email, position, presenter, manager_id FROM users WHERE manager_id = ?
                                UNION ALL
                                SELECT u.id, u.name, u.email, u.position, u.presenter, u.manager_id FROM users u
                                JOIN Subordinates s ON u.manager_id = s.id
                            )
                            SELECT s.id, s.name, s.email, s.position, s.presenter, s.manager_id,
                            SUM(op.quantity * op.price) AS total_sales
                            FROM Subordinates s
                            LEFT JOIN orders o ON s.id = o.user_id
                            LEFT JOIN order_product op ON o.id = op.order_id
                            GROUP BY s.id`;
    
                        this.connection.query(subordinatesQuery, [id], (error, results) => {
                            if (error) {
                                reject(error);
                            } else {
                                // Tính tổng doanh thu của người quản lý
                                const manager_revenue = results.reduce((total, result) => total + result.total_sales, 0);
    
                                // Lọc ra các nhân viên (staffs)
                                const staffs = results.filter(result => result.id !== id);
    
                                resolve({ user, manager_revenue, staffs });
                            }
                        });
                    }
                });
            });
            return result;
        } catch (error) {
            throw new Error(error);
        }
    }
    
    
    
     
    
}

module.exports = RevenueService;
