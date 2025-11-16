import { Router, Request, Response } from "express";
import { mockLlmStream } from "../../services/chat.service";
import { Message } from "../../types/chat";

// Create a new router instance
const router = Router();

// This function will handle requests to our streaming endpoint
export default (app: Router) => {
  app.use("/chat", router);

  router.post("/stream", async (req: Request, res: Response) => {
    try {
      // We get the messages from the client, even if we don't use them in the mock
      const { messages }: { messages: Message[] } = req.body;

      if (!messages) {
        return res.status(400).json({ error: "Messages are required" });
      }

      // --- Important: Set Headers for Streaming ---
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.setHeader("Transfer-Encoding", "chunked");

      // Get the async generator from our service
      const stream = mockLlmStream(messages);

      // Pipe the stream to the response
      // The `for await...of` loop is perfect for consuming async generators
      for await (const chunk of stream) {
        res.write(chunk); // Write each chunk to the response as it arrives
      }

      res.end(); // End the response when the stream is finished
    } catch (error) {
      console.error("Error in chat stream:", error);
      res.status(500).send("Something went wrong during the stream.");
    }
  });
};
