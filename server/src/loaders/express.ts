import express from "express";
import cors from "cors";
import routes from "../api";

export default ({ app }: { app: express.Application }) => {
  // --- Middleware Setup ---

  // Enable Cross-Origin Resource Sharing (CORS) to allow your React app to communicate
  app.use(cors());

  // Middleware that transforms the raw request body into a JSON object
  app.use(express.json());

  // --- API Routes Setup ---

  // Load the API routes, prefixing them with "/api"
  // All routes defined in src/api will now be accessible under http://localhost:PORT/api/...
  app.use("/api", routes());

  // --- Error Handling (Optional but good practice) ---
  // You can add error handling middleware here

  // Return the configured app
  return app;
};
