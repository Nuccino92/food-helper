import TextareaAutosize from "react-textarea-autosize";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, type KeyboardEvent, type FormEvent } from "react"; // Import KeyboardEvent and FormEvent
import { cn } from "@/lib/utils";
import { usePersona } from "@/context/PersonaProvider/hooks";

interface ChatInputFormProps {
  onSend: (message: string) => void;
  isLoading: boolean;
}

export function ChatInputForm({ onSend, isLoading }: ChatInputFormProps) {
  const { persona } = usePersona();
  const [inputValue, setInputValue] = useState("");

  const handleSubmit = (e?: FormEvent) => {
    e?.preventDefault(); // Prevent the form from reloading the page
    if (!inputValue.trim() || isLoading) return;

    onSend(inputValue);
    setInputValue("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Check if Enter is pressed and Shift is NOT pressed
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault(); // Prevent adding a new line
      handleSubmit(); // Trigger the submit handler
    }
  };

  const placeholder = {
    "assistant-miso": "Ask Miso...",
    "assistant-gordon": "Ask Gordon...",
    "assistant-sancho": "Ask Sancho",
  };

  return (
    <div className="rounded-2xl border-t bg-white p-4 shadow-md">
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
              placeholder={placeholder[persona]}
              className={cn(
                "custom-scrollbar",
                "placeholder:text-muted-foreground flex w-full resize-none border-0! bg-transparent p-2 placeholder:font-medium",
                "dark:text-primary-foreground focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none",
              )}
            />
          </div>

          <div className="flex items-center">
            <Button
              type="submit"
              size="icon"
              className="rounded-lg bg-gray-200 hover:bg-gray-100"
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
