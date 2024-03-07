const app = require("./app");
const config = require("./app/config");
const MySQL = require("./app/utils/mysql.util");

//start server
async function startServer() {
    try {
        await MySQL.connect(config.db);
        console.log("Connected to the database!");

        const PORT = config.app.port;
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    } catch (error) {
        console.log("Cannot connect to the database!", error);
        process.exit();
    }
}

startServer();
