import { Router, Request, Response } from "express";
// IMPORTANT: Make sure to import the new service function
import { mockLlmSseStream } from "../../services/chat.service";
import { Message } from "../../types/chat";

const router = Router();

export default (app: Router) => {
  app.use("/chat", router);

  // We are keeping this as a POST route to align with real LLM APIs
  // that need to receive a large conversation history in the body.
  router.post("/stream", async (req: Request, res: Response) => {
    try {
      const { messages }: { messages: Message[] } = req.body;
      if (!messages) {
        return res.status(400).json({ error: "Messages are required" });
      }

      // --- CRITICAL: Set Headers for Server-Sent Events (SSE) ---
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.flushHeaders(); // Flush the headers to establish the connection

      // Get the async generator from our NEW SSE service
      const stream = mockLlmSseStream(messages);

      // Pipe the formatted SSE events to the response
      for await (const sseEvent of stream) {
        res.write(sseEvent);
      }

      // We don't explicitly call res.end(). The 'end' event will signal the client
      // to close the connection. The connection will also close if the client disconnects.
    } catch (error) {
      console.error("Error in chat stream:", error);
      // Can't send a 500 header here as they are already sent.
      // Just log it and the connection will close.
    }
  });
};
