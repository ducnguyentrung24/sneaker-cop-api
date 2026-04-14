require("dotenv").config();
const app = require("./app");
const sequelize = require("./config/database");

// Load model
require("./modules/user/user.model");
require("./modules/brand/brand.model");
require("./modules/category/category.model");

const PORT = process.env.PORT || 8000;

async function startServer() {
    try {
        await sequelize.authenticate();
        console.log("Database connected");

        await sequelize.sync();
        console.log("Database synced");

        app.listen(PORT, () => {
            console.log(`Server is running at http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error("Error starting server:", error.message);
        process.exit(1);
    }
}

startServer();