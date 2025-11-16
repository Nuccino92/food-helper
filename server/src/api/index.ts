import { Router } from "express";
import chatRoutes from "./routes/chat"; // Import our new chat route

export default () => {
  const app = Router();

  // Register the chat routes
  chatRoutes(app);

  // You can register other routes here in the future
  // e.g., userRoutes(app);

  return app;
};
