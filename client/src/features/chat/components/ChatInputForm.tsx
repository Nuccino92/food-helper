import TextareaAutosize from "react-textarea-autosize";
import { Mic, Plus, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface ChatInputFormProps {
  onSend: (message: string) => void;
  isLoading: boolean;
}

export function ChatInputForm({ onSend, isLoading }: ChatInputFormProps) {
  const [inputValue, setInputValue] = useState("");

  return (
    <div className="bg-background rounded-2xl border-t p-4">
      {/* Centering and max-width container */}
      <div className="mx-auto max-w-3xl">
        {/* Main form container with border and flex layout */}
        <form className="bg-background relative flex w-full items-end rounded-full">
          {/* 1. LEFT-SIDE BUTTONS */}
          {/* <div className="flex items-center">
            <Button variant="ghost" size="icon" type="button">
              <Plus className="h-5 w-5" />
            </Button>
          </div> */}

          {/* 2. THE GROWING TEXTAREA */}
          <div className="mx-2 flex-1">
            <TextareaAutosize
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              maxRows={12}
              minRows={1}
              placeholder="Message..."
              className={cn(
                `custom-scrollbar`,
                "placeholder:text-muted-foreground flex w-full resize-none border-0 bg-transparent p-2 text-base focus-visible:ring-0 focus-visible:ring-offset-0",
              )}
            />
          </div>

          {/* 3. RIGHT-SIDE BUTTONS */}
          <div className="flex items-center">
            {/* <Button variant="ghost" size="icon" type="button">
              <Mic className="h-5 w-5" />
            </Button> */}
            <Button
              type="submit"
              size="icon"
              className="rounded-lg bg-white hover:bg-gray-200"
              disabled={!inputValue.trim()}
            >
              <Send className="h-5 w-5 text-black" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
