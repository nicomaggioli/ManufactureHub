import { useState, useCallback, useRef } from 'react';
import { Upload, Image as ImageIcon, X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface TechPackImageUploadProps {
  onImageSelected: (dataUrl: string, fileName: string) => void;
}

export function TechPackImageUpload({ onImageSelected }: TechPackImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith('image/')) return;
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (e) => {
        const url = e.target?.result as string;
        setPreview(url);
      };
      reader.readAsDataURL(file);
    },
    []
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => setIsDragging(false), []);

  const clearPreview = () => {
    setPreview(null);
    setFileName('');
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-2xl mx-auto py-8 gap-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold text-gray-900 tracking-tight">
          Upload Your Design
        </h2>
        <p className="text-gray-500 text-sm max-w-md">
          Drop in a sketch, mockup, or reference image. Our AI will analyze it and guide you through creating a complete tech pack.
        </p>
      </div>

      {!preview ? (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => inputRef.current?.click()}
          className={cn(
            'w-full aspect-[4/3] max-h-[420px] rounded-2xl border-2 border-dashed cursor-pointer',
            'flex flex-col items-center justify-center gap-4 transition-all duration-200',
            isDragging
              ? 'border-emerald-500 bg-emerald-50/50 scale-[1.01]'
              : 'border-gray-200 bg-gray-50/50 hover:border-gray-300 hover:bg-gray-50'
          )}
        >
          <div
            className={cn(
              'w-16 h-16 rounded-2xl flex items-center justify-center transition-colors',
              isDragging ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-400'
            )}
          >
            <Upload className="w-7 h-7" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-gray-700">
              {isDragging ? 'Drop your design here' : 'Drag & drop your design'}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              PNG, JPG, or SVG — sketches, mockups, or reference images
            </p>
          </div>
          <Button variant="outline" size="sm" className="mt-2" onClick={(e) => e.stopPropagation()}>
            Browse Files
          </Button>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
        </div>
      ) : (
        <div className="w-full space-y-4">
          <div className="relative w-full max-h-[420px] rounded-2xl overflow-hidden bg-gray-50 border border-gray-200">
            <img
              src={preview}
              alt="Design preview"
              className="w-full max-h-[420px] object-contain"
            />
            <button
              onClick={clearPreview}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition-colors"
            >
              <X className="w-4 h-4 text-gray-600" />
            </button>
            <div className="absolute bottom-3 left-3 px-3 py-1.5 rounded-lg bg-white/90 backdrop-blur border border-gray-200">
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <ImageIcon className="w-3.5 h-3.5" />
                {fileName}
              </div>
            </div>
          </div>

          <Button
            onClick={() => onImageSelected(preview, fileName)}
            className="w-full h-12 text-base font-medium bg-gray-900 hover:bg-gray-800 text-white rounded-xl gap-2"
          >
            <Sparkles className="w-4 h-4" />
            Analyze Design
          </Button>
        </div>
      )}
    </div>
  );
}
