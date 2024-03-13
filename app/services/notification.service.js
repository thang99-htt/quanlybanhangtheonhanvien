
class NotificationService {
    constructor(connection) {
        this.connection = connection;        
    }

    async create(payload) {
        const notification = {
            sendto: payload.sendto,
            sendby: payload.sendby,
            message: payload.message,
            date: payload.date,
            readed: 0
        };
    
        return new Promise((resolve, reject) => {
            try {
                const checkDuplicateQuery = 'SELECT * FROM notifications WHERE sendby = ? AND sendto = ? AND date = ?';
                this.connection.query(checkDuplicateQuery, [notification.sendby, notification.sendto, notification.date], (checkError, checkResult) => {
                    if (checkError) {
                        reject(checkError);
                    } else {
                        if (checkResult.length > 0) {
                            reject("Notification already exists for the given sendby, sendto and date");
                        } else {
                            const insertNotificationQuery = 'INSERT INTO notifications SET ?';
                            this.connection.query(insertNotificationQuery, notification, (insertError, insertResult) => {
                                if (insertError) {
                                    reject(insertError);
                                } else {
                                    resolve();
                                }
                            });
                        }
                    }
                });
            } catch (error) {
                reject(error);
            }
        });
    }
    

    async find() {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT *
                FROM notifications order by id desc`;
    
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
        return new Promise((resolve, reject) => {
            const query = `
                SELECT *
                FROM notifications where sendto = ? order by id desc`;
    
            this.connection.query(query, [id], (error, results) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(results);
                }
            });
        });
    }

    async updateReaded(id) {
        return new Promise((resolve, reject) => {
            const query = `
            UPDATE notifications 
            SET readed = 1
            WHERE id = ? AND readed = 0;
            `;
    
            this.connection.query(query, [id], (error, results) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(results);
                }
            });
        });
    }
    
}

module.exports = NotificationService;
