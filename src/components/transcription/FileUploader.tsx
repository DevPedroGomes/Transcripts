"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface FileUploaderProps {
  onFileChange: (file: File | null) => void;
  onError?: (error: string) => void;
  maxSizeMB?: number;
  acceptedFileTypes?: string[];
}

export function FileUploader({
  onFileChange,
  onError,
  maxSizeMB = 500,
  acceptedFileTypes = [".mp3", ".wav", ".m4a", ".ogg"],
}: FileUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const maxSize = maxSizeMB * 1024 * 1024; // em bytes

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const uploadedFile = acceptedFiles[0];

      if (uploadedFile) {
        if (uploadedFile.size > maxSize) {
          const errorMsg = `O arquivo é muito grande. O tamanho máximo é ${maxSizeMB}MB.`;
          setError(errorMsg);
          if (onError) onError(errorMsg);
          return;
        }

        setFile(uploadedFile);
        setError(null);
        onFileChange(uploadedFile);
      }
    },
    [maxSize, maxSizeMB, onError, onFileChange]
  );

  const removeFile = () => {
    setFile(null);
    setError(null);
    onFileChange(null);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    accept: {
      "audio/mpeg": [],
      "audio/wav": [],
      "audio/x-m4a": [],
      "audio/ogg": [],
    },
  });

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " bytes";
    else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    else return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <div className="w-full">
      {!file ? (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragActive ? "border-primary bg-primary/10" : "border-gray-300 hover:border-primary/50"
          }`}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center justify-center">
            <Upload className="h-10 w-10 text-gray-400 mb-4" />
            <p className="mb-2 text-sm font-semibold">
              {isDragActive ? "Solte o arquivo aqui" : "Clique para fazer upload ou arraste e solte"}
            </p>
            <p className="text-xs text-gray-500">
              {acceptedFileTypes.join(", ")} (Max. {maxSizeMB}MB)
            </p>
          </div>
        </div>
      ) : (
        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <audio className="h-5 w-5 text-primary" />
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={removeFile}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Remover arquivo</span>
            </Button>
          </div>
          <Progress value={100} className="h-1" />
        </div>
      )}

      {error && (
        <div className="mt-2 flex items-center gap-2 text-red-500 text-sm">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
} 