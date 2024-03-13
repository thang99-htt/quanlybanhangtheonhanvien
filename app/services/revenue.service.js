class RevenueService {
    constructor(connection) {
        this.connection = connection;        
    }

    async findById(id) {
        try {
            const userResult = await new Promise((resolve, reject) => {
                const userQuery = `
                    SELECT u.id, u.name, u.email, u.role, u.presenter, u.manager_id, m.name AS manager_name
                    FROM users u
                    LEFT JOIN users m ON u.manager_id = m.id
                    WHERE u.id = ?`;
                    
                this.connection.query(userQuery, [id], (userError, userResult) => {
                    if (userError) {
                        reject(userError);
                    } else {
                        resolve(userResult[0]);
                    }
                });
            });
    
            const userSalesResult = await new Promise((resolve, reject) => {
                const userSalesQuery = `
                    SELECT SUM(op.quantity * op.price) AS user_total_sales
                    FROM orders o
                    LEFT JOIN order_product op ON o.id = op.order_id
                    WHERE o.user_id = ?`;
                    
                this.connection.query(userSalesQuery, [id], (error, results) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(results[0].user_total_sales || 0);
                    }
                });
            });
    
            const subordinatesResult = await new Promise((resolve, reject) => {
                const subordinatesQuery = `
                WITH RECURSIVE Subordinates AS (
                    SELECT id, name, email, role, presenter, manager_id FROM users WHERE manager_id = ?
                    UNION ALL
                    SELECT u.id, u.name, u.email, u.role, u.presenter, u.manager_id FROM users u
                    JOIN Subordinates s ON u.manager_id = s.id
                )
                SELECT 
                    s.id, 
                    s.name, 
                    s.email, 
                    s.role, 
                    s.presenter, 
                    s.manager_id,
                    m.name AS manager_name, -- Thêm manager_name vào truy vấn
                    SUM(op.quantity * op.price) AS total_sales
                FROM Subordinates s
                LEFT JOIN users m ON s.manager_id = m.id -- Liên kết để lấy tên của người quản lý
                LEFT JOIN orders o ON s.id = o.user_id
                LEFT JOIN order_product op ON o.id = op.order_id
                GROUP BY s.id;
                `;
                    
                this.connection.query(subordinatesQuery, [id], (error, results) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(results);
                    }
                });
            });
    
            // Tính tổng doanh thu của người quản lý
            const manager_revenue = subordinatesResult.reduce((total, result) => total + result.total_sales, 0);
    
            // Lọc ra các nhân viên (staffs)
            const staffs = subordinatesResult.filter(result => result.id !== id);
    
            return { user: userResult, personal_revenue: userSalesResult, manager_revenue, staffs };
        } catch (error) {
            throw new Error(error);
        }
    }
    
    
    
    
     
    
}

module.exports = RevenueService;
