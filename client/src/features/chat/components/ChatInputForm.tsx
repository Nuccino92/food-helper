import TextareaAutosize from "react-textarea-autosize";
import { Send, ImagePlus, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useState,
  useEffect,
  useRef,
  type KeyboardEvent,
  type FormEvent,
} from "react";
import { cn } from "@/lib/utils";
import { usePersona } from "@/context/PersonaProvider/hooks";
import { useImageUpload } from "../hooks/useImageUpload";
import { StagedImages } from "./StagedImages";
import { PERSONAS } from "@/components/PersonaSelector";

export interface ImageData {
  base64: string;
  mimeType: string;
}

interface ChatInputFormProps {
  onSend: (message: string, images?: ImageData[]) => void;
  isLoading: boolean;
}

// Detect if device has camera (mobile)
const isMobileDevice = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent,
  );
};

export function ChatInputForm({ onSend, isLoading }: ChatInputFormProps) {
  const { persona } = usePersona();
  const [inputValue, setInputValue] = useState("");
  const [showMobileOptions, setShowMobileOptions] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const {
    stagedImages,
    fileInputRef,
    removeImage,
    clearAllImages,
    handlePaste,
    handleFileSelect,
    openFilePicker,
    getReadyImages,
    hasImages,
    canAddMore,
    allReady,
  } = useImageUpload(4);

  // Paste listener
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const onPaste = (e: ClipboardEvent) => handlePaste(e);
    textarea.addEventListener("paste", onPaste);
    return () => textarea.removeEventListener("paste", onPaste);
  }, [handlePaste]);

  const handleSubmit = (e?: FormEvent) => {
    e?.preventDefault();

    const hasText = inputValue.trim().length > 0;
    const readyImages = getReadyImages();
    const hasReadyImages = readyImages.length > 0;

    if ((!hasText && !hasReadyImages) || isLoading) return;
    if (hasImages && !allReady) return; // Wait for processing

    const imageData: ImageData[] = readyImages.map((img) => {
      const base64 = img.base64!;
      const mimeType = base64.split(";")[0].split(":")[1];
      return { base64, mimeType };
    });

    onSend(inputValue, imageData.length > 0 ? imageData : undefined);
    setInputValue("");
    clearAllImages();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const placeholder = {
    "assistant-miso": "Ask Miso...",
    "assistant-gordon": "Ask Gordon...",
    "assistant-sancho": "Ask Sancho",
  };

  const personaName = PERSONAS.find((p) => p.value === persona)?.name;

  // Persona-themed colors for the upload button (matching aura colors)
  const buttonStyles = {
    "assistant-miso": {
      button: "bg-teal-50 hover:bg-teal-100 border-teal-200",
      icon: "text-teal-600",
    },
    "assistant-gordon": {
      button: "bg-rose-50 hover:bg-rose-100 border-rose-200",
      icon: "text-rose-600",
    },
    "assistant-sancho": {
      button: "bg-yellow-50 hover:bg-yellow-100 border-yellow-200",
      icon: "text-yellow-700",
    },
  };

  const canSubmit =
    (inputValue.trim() || (hasImages && allReady)) && !isLoading;

  // Glow class based on persona
  const glowClass = {
    "assistant-miso": "chat-input-glow chat-input-glow-miso",
    "assistant-gordon": "chat-input-glow chat-input-glow-gordon",
    "assistant-sancho": "chat-input-glow chat-input-glow-sancho",
  };

  return (
    <div className={cn("rounded-2xl bg-white p-4 shadow-md", glowClass[persona])}>
      {/* Staged images preview */}
      <StagedImages images={stagedImages} onRemove={removeImage} />

      <form onSubmit={handleSubmit} className="flex flex-col">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          capture={undefined}
        />

        {/* Text input - full width at top */}
        <TextareaAutosize
          ref={textareaRef}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          maxRows={12}
          minRows={1}
          placeholder={
            hasImages ? "Add a message (optional)..." : placeholder[persona]
          }
          className={cn(
            "custom-scrollbar",
            "w-full resize-none border-0! bg-transparent text-left placeholder:font-medium",
            "dark:text-primary-foreground mb-4 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none",
          )}
        />

        {/* Bottom bar with upload button and send button */}
        <div className="flex items-center justify-between pt-2">
          {/* Image upload button */}
          <div className="relative">
            {isMobileDevice() ? (
              <>
                <Button
                  type="button"
                  onClick={() => setShowMobileOptions(!showMobileOptions)}
                  disabled={!canAddMore || isLoading}
                  className={cn(
                    "h-10 w-10 rounded-xl border transition-all",
                    buttonStyles[persona].button,
                    !canAddMore && "opacity-50",
                  )}
                  aria-label="Add image"
                >
                  <ImagePlus
                    className={cn("h-5 w-5", buttonStyles[persona].icon)}
                  />
                </Button>

                {/* Mobile options dropdown */}
                {showMobileOptions && (
                  <div className="absolute bottom-full left-0 mb-2 flex flex-col gap-1 rounded-lg border bg-white p-1 shadow-lg">
                    <button
                      type="button"
                      onClick={() => {
                        if (fileInputRef.current) {
                          fileInputRef.current.capture = "environment";
                          fileInputRef.current.click();
                        }
                        setShowMobileOptions(false);
                      }}
                      className="flex items-center gap-2 rounded px-3 py-2 text-sm hover:bg-gray-100"
                    >
                      <Camera className="h-4 w-4" />
                      Take Photo
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (fileInputRef.current) {
                          fileInputRef.current.removeAttribute("capture");
                          fileInputRef.current.click();
                        }
                        setShowMobileOptions(false);
                      }}
                      className="flex items-center gap-2 rounded px-3 py-2 text-sm hover:bg-gray-100"
                    >
                      <ImagePlus className="h-4 w-4" />
                      Choose from Gallery
                    </button>
                  </div>
                )}
              </>
            ) : (
              <Button
                type="button"
                onClick={openFilePicker}
                disabled={!canAddMore || isLoading}
                className={cn(
                  "h-10 w-10 rounded-xl border transition-all",
                  buttonStyles[persona].button,
                  !canAddMore && "opacity-50",
                )}
                aria-label="Add image"
              >
                <ImagePlus
                  className={cn("h-5 w-5", buttonStyles[persona].icon)}
                />
              </Button>
            )}
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-400">
              Chatting with {personaName}
            </span>

            {/* Send button */}
            <Button
              type="submit"
              size="icon"
              className="rounded-lg bg-gray-200 hover:bg-gray-100"
              disabled={!canSubmit}
            >
              <Send className="h-5 w-5 text-black" />
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
