'use client';

import { useCallback, useRef, useState } from 'react';
import { Upload, X, AlertCircle, Music } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
  acceptedFileTypes = ['.mp3', '.wav', '.m4a', '.ogg'],
}: FileUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const maxSize = maxSizeMB * 1024 * 1024; // em bytes

  const handleFiles = useCallback(
    (incoming?: FileList | File[]) => {
      const uploadedFile = incoming?.[0];
      if (!uploadedFile) return;

      const isAcceptedType = acceptedFileTypes.some((type) =>
        uploadedFile.name.toLowerCase().endsWith(type.toLowerCase())
      );

      if (!isAcceptedType) {
        const errorMsg = `Formato não suportado. Tipos permitidos: ${acceptedFileTypes.join(', ')}`;
        setError(errorMsg);
        if (onError) onError(errorMsg);
        return;
      }

      if (uploadedFile.size > maxSize) {
        const errorMsg = `O arquivo é muito grande. O tamanho máximo é ${maxSizeMB}MB.`;
        setError(errorMsg);
        if (onError) onError(errorMsg);
        return;
      }

      setFile(uploadedFile);
      setError(null);
      onFileChange(uploadedFile);
    },
    [acceptedFileTypes, maxSize, maxSizeMB, onError, onFileChange]
  );

  const removeFile = () => {
    setFile(null);
    setError(null);
    onFileChange(null);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' bytes';
    else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragActive(false);
    if (event.dataTransfer.files?.length) {
      handleFiles(event.dataTransfer.files);
    }
  };

  return (
    <div className="w-full">
      {!file ? (
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragActive
              ? 'border-primary bg-primary/10'
              : 'border-border hover:border-primary/50'
          }`}
          onClick={() => inputRef.current?.click()}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragActive(true);
          }}
          onDragEnter={(event) => {
            event.preventDefault();
            setIsDragActive(true);
          }}
          onDragLeave={(event) => {
            event.preventDefault();
            setIsDragActive(false);
          }}
          onDrop={handleDrop}
          role="presentation"
        >
          <input
            type="file"
            className="hidden"
            onChange={(event) => handleFiles(event.target.files || undefined)}
            accept={acceptedFileTypes.join(',')}
            ref={inputRef}
          />
          <div className="flex flex-col items-center justify-center">
            <Upload className="h-10 w-10 text-muted-foreground mb-4" />
            <p className="mb-2 text-sm font-semibold">
              {isDragActive
                ? 'Solte o arquivo aqui'
                : 'Clique para fazer upload ou arraste e solte'}
            </p>
            <p className="text-xs text-muted-foreground">
              {acceptedFileTypes.join(', ')} (Max. {maxSizeMB}MB)
            </p>
          </div>
        </div>
      ) : (
        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Music className="h-5 w-5 text-primary" />
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={removeFile}>
              <X className="h-4 w-4" />
              <span className="sr-only">Remover arquivo</span>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Pronto para enviar</p>
        </div>
      )}

      {error && (
        <div className="mt-2 flex items-center gap-2 text-destructive text-sm">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
