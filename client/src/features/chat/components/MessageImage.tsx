import { useState } from "react";
import { cn } from "@/lib/utils";
import { ImageModal } from "./ImageModal";

interface MessageImageProps {
  src: string;
  alt?: string;
  className?: string;
}

export function MessageImage({ src, alt, className }: MessageImageProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsModalOpen(true)}
        className={cn(
          "overflow-hidden rounded-lg border border-gray-200",
          "transition-transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-blue-500",
          className
        )}
      >
        <img
          src={src}
          alt={alt || "Uploaded image"}
          className="h-32 w-32 object-cover"
        />
      </button>

      <ImageModal
        src={src}
        alt={alt}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
      />
    </>
  );
}

interface MessageImagesProps {
  images: Array<{ url: string; alt?: string }>;
}

export function MessageImages({ images }: MessageImagesProps) {
  if (images.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mb-2">
      {images.map((image, index) => (
        <MessageImage
          key={index}
          src={image.url}
          alt={image.alt || `Image ${index + 1}`}
        />
      ))}
    </div>
  );
}
