import express from "express";
import cors from "cors";
import routes from "../api";

export default ({ app }: { app: express.Application }) => {
  // --- Middleware Setup ---

  // Enable Cross-Origin Resource Sharing (CORS) to allow your React app to communicate
  app.use(
    cors({
      origin: process.env.ALLOWED_ORIGIN || "http://localhost:5173",
    })
  );

  // Middleware that transforms the raw request body into a JSON object
  // Increased limit to handle base64 encoded images (up to ~30MB to accommodate multiple compressed images)
  app.use(express.json({ limit: "30mb" }));

  // --- API Routes Setup ---

  // Load the API routes, prefixing them with "/api"
  // All routes defined in src/api will now be accessible under http://localhost:PORT/api/...
  app.use("/api", routes());

  // --- Error Handling (Optional but good practice) ---
  // You can add error handling middleware here

  // Return the configured app
  return app;
};
