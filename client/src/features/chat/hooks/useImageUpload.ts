import { useState, useCallback, useRef } from "react";

export interface StagedImage {
  id: string;
  file: File;
  previewUrl: string;
  base64?: string;
  status: "processing" | "ready" | "error";
  error?: string;
}

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB
const MAX_DIMENSION = 2048;
const TARGET_QUALITY = 0.8;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

function generateId(): string {
  return `img_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

async function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      reject(new Error("Could not get canvas context"));
      return;
    }

    img.onload = () => {
      let { width, height } = img;

      // Scale down if exceeds max dimension
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);

      // Convert to base64 (use JPEG for compression, preserve PNG for transparency)
      const mimeType = file.type === "image/png" ? "image/png" : "image/jpeg";
      const base64 = canvas.toDataURL(mimeType, TARGET_QUALITY);
      resolve(base64);
    };

    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = URL.createObjectURL(file);
  });
}

export function useImageUpload(maxImages: number = 4) {
  const [stagedImages, setStagedImages] = useState<StagedImage[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback((file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return `Unsupported format. Please use JPEG, PNG, GIF, or WebP.`;
    }
    if (file.size > MAX_FILE_SIZE) {
      return `File too large. Maximum size is 25MB.`;
    }
    return null;
  }, []);

  const processImage = useCallback(async (file: File): Promise<StagedImage> => {
    const id = generateId();
    const previewUrl = URL.createObjectURL(file);

    const validationError = validateFile(file);
    if (validationError) {
      return {
        id,
        file,
        previewUrl,
        status: "error",
        error: validationError,
      };
    }

    try {
      const base64 = await compressImage(file);
      return {
        id,
        file,
        previewUrl,
        base64,
        status: "ready",
      };
    } catch (error) {
      return {
        id,
        file,
        previewUrl,
        status: "error",
        error: error instanceof Error ? error.message : "Failed to process image",
      };
    }
  }, [validateFile]);

  const addImages = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const availableSlots = maxImages - stagedImages.length;
    const filesToProcess = fileArray.slice(0, availableSlots);

    if (filesToProcess.length === 0) return;

    // Add placeholder entries immediately for UX
    const placeholders: StagedImage[] = filesToProcess.map((file) => ({
      id: generateId(),
      file,
      previewUrl: URL.createObjectURL(file),
      status: "processing" as const,
    }));

    setStagedImages((prev) => [...prev, ...placeholders]);

    // Process each image and update state
    const processed = await Promise.all(filesToProcess.map(processImage));

    setStagedImages((prev) => {
      const existingIds = new Set(placeholders.map((p) => p.id));
      const filteredPrev = prev.filter((img) => !existingIds.has(img.id));
      return [...filteredPrev, ...processed];
    });
  }, [maxImages, stagedImages.length, processImage]);

  const removeImage = useCallback((id: string) => {
    setStagedImages((prev) => {
      const img = prev.find((i) => i.id === id);
      if (img) {
        URL.revokeObjectURL(img.previewUrl);
      }
      return prev.filter((i) => i.id !== id);
    });
  }, []);

  const clearAllImages = useCallback(() => {
    stagedImages.forEach((img) => URL.revokeObjectURL(img.previewUrl));
    setStagedImages([]);
  }, [stagedImages]);

  const handlePaste = useCallback((e: ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    const imageFiles: File[] = [];
    for (const item of items) {
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) imageFiles.push(file);
      }
    }

    if (imageFiles.length > 0) {
      e.preventDefault();
      addImages(imageFiles);
    }
  }, [addImages]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      addImages(files);
    }
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [addImages]);

  const openFilePicker = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const getReadyImages = useCallback(() => {
    return stagedImages.filter((img) => img.status === "ready" && img.base64);
  }, [stagedImages]);

  const hasImages = stagedImages.length > 0;
  const canAddMore = stagedImages.length < maxImages;
  const allReady = stagedImages.every((img) => img.status === "ready");

  return {
    stagedImages,
    fileInputRef,
    addImages,
    removeImage,
    clearAllImages,
    handlePaste,
    handleFileSelect,
    openFilePicker,
    getReadyImages,
    hasImages,
    canAddMore,
    allReady,
  };
}
