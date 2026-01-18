import { Router } from "express";
import chatRoutes from "./routes/chat";
import rateLimitRoutes from "./routes/rateLimit";

export default () => {
  const app = Router();

  // Register routes
  chatRoutes(app);
  rateLimitRoutes(app);

  return app;
};
