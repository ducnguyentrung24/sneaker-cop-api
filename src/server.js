require("dotenv").config();
const app = require("./app");

const PORT = process.env.PORT || 8000;

async function startServer() {
    try {
        app.listen(PORT, () => {
            console.log(`Server is running at http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error("Error starting server:", error);
        process.exit(1);
    }
}

startServer();