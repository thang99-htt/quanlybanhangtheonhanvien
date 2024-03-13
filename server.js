const app = require("./app");
const config = require("./app/config");
const MySQL = require("./app/utils/mysql.util");

//start server
async function startServer() {
    try {
        await MySQL.connect(config.db);
        console.log("Connected to the database!");

        const PORT = config.app.port;
        const server = app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });

        const io = require('socket.io')(server);
        io.on("connection", (socket) => {
            console.log('Connected Successfully', socket.id);
            socket.on('message', (data) => {
                console.log(data); 
                io.emit('message-receive', data);
            });
            socket.on('disconnect', () => {
                console.log('Disconnected', socket.id);
            })
        })
    } catch (error) {
        console.log("Cannot connect to the database!", error);
        process.exit();
    }
}

startServer();
