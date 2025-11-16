import express from "express";
import "dotenv/config"; // Loads environment variables from .env file
import loaders from "./loaders"; // Imports the main loader function from src/loaders/index.ts

async function startServer() {
  // Create the express app
  const app = express();

  // Initialize all application loaders
  await loaders({ expressApp: app });

  // Define the port, getting it from environment variables with a fallback
  const port = process.env.PORT || 8000;

  // Start the server and listen on the specified port
  app
    .listen(port, () => {
      console.log(`
      ################################################
      🛡️  Server listening on port: ${port} 🛡️
      ################################################
    `);
    })
    .on("error", (err) => {
      console.error(err);
      process.exit(1);
    });
}

// Start the server
startServer();
