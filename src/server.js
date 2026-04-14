require("dotenv").config();
const app = require("./app");

const { sequelize, initModels } = require("./models");

const PORT = process.env.PORT || 8000;

async function startServer() {
    try {
        // 1. Connect DB
        await sequelize.authenticate();
        console.log("Database connected");

        // 2. Init associations
        initModels();

        // 3. Sync DB
        await sequelize.sync();
        console.log("Database synced");

        // 4. Start server
        app.listen(PORT, () => {
            console.log(`Server is running at http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error("Error starting server:", error.message);
        process.exit(1);
    }
}

startServer();