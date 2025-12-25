import TextareaAutosize from "react-textarea-autosize";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, type KeyboardEvent, type FormEvent } from "react"; // Import KeyboardEvent and FormEvent
import { cn } from "@/lib/utils";

interface ChatInputFormProps {
  onSend: (message: string) => void;
  isLoading: boolean;
}

export function ChatInputForm({ onSend, isLoading }: ChatInputFormProps) {
  const [inputValue, setInputValue] = useState("");

  // 1. Create a submit handler
  const handleSubmit = (e?: FormEvent) => {
    e?.preventDefault(); // Prevent the form from reloading the page
    if (!inputValue.trim() || isLoading) return;

    onSend(inputValue);
    // 2. Clear the input after sending
    setInputValue("");
  };

  // 3. Create a keydown handler for "Enter" to send
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Check if Enter is pressed and Shift is NOT pressed
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault(); // Prevent adding a new line
      handleSubmit(); // Trigger the submit handler
    }
  };

  return (
    <div className="dark:bg-muted/50 rounded-2xl border-t p-4 shadow-md">
      <div className="">
        {/* Add the onSubmit handler to the form */}
        <form
          onSubmit={handleSubmit}
          className="relative flex w-full items-end rounded-full"
        >
          <div className="mx-2 w-full">
            <TextareaAutosize
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown} // Add the keydown handler
              maxRows={12}
              minRows={1}
              placeholder="Ask Miso..."
              className={cn(
                "custom-scrollbar",
                "placeholder:text-muted-foreground flex w-full resize-none border-0! bg-transparent p-2 text-base",
                "focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none",
              )}
            />
          </div>

          <div className="flex items-center">
            <Button
              type="submit"
              size="icon"
              className="rounded-lg bg-gray-200 hover:bg-gray-100 dark:bg-white"
              disabled={!inputValue.trim() || isLoading} // Also disable while loading
            >
              <Send className="h-5 w-5 text-black" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
