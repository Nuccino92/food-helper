import { X, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { StagedImage } from "../hooks/useImageUpload";

interface StagedImagesProps {
  images: StagedImage[];
  onRemove: (id: string) => void;
}

export function StagedImages({ images, onRemove }: StagedImagesProps) {
  if (images.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 pb-4">
      {images.map((image) => (
        <div
          key={image.id}
          className={cn(
            "relative h-20 w-20 overflow-hidden rounded-lg border",
            image.status === "error" && "border-red-400",
            image.status === "processing" && "border-blue-400",
            image.status === "ready" && "border-gray-200",
          )}
        >
          <img
            src={image.previewUrl}
            alt="Staged upload"
            className={cn(
              "h-full w-full object-cover",
              image.status !== "ready" && "opacity-50",
            )}
          />

          {/* Processing overlay */}
          {image.status === "processing" && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
              <Loader2 className="h-5 w-5 animate-spin text-white" />
            </div>
          )}

          {/* Error overlay */}
          {image.status === "error" && (
            <div className="absolute inset-0 flex items-center justify-center bg-red-500/30">
              <AlertCircle className="h-5 w-5 text-white" />
            </div>
          )}

          {/* Remove button */}
          <button
            type="button"
            onClick={() => onRemove(image.id)}
            className={cn(
              "absolute top-1 right-1 rounded-full p-0.5",
              "bg-black/60 text-white hover:bg-black/80",
              "transition-colors",
            )}
            aria-label="Remove image"
          >
            <X className="h-3.5 w-3.5" />
          </button>

          {/* Error tooltip */}
          {image.status === "error" && image.error && (
            <div className="absolute right-0 bottom-0 left-0 truncate bg-red-500 px-1 py-0.5 text-[10px] text-white">
              {image.error}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
