const mysql = require('mysql');

class MySQL {
    static connect = async (config) => {
        if (this.connection) return this.connection;

        this.connection = mysql.createConnection({
            host: config.host,
            user: config.user,
            password: config.password,
            database: config.database
        });

        this.connection.connect((err) => {
            if (err) {
                console.error('Error connecting to MySQL database: ' + err.stack);
                return;
            }
            console.log('Connected to MySQL database as id ' + this.connection.threadId);
        });

        return this.connection;
    };
}

module.exports = MySQL;
