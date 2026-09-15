import { X } from 'lucide-react';

interface ImageViewerProps {
  url: string;
  onClose: () => void;
}

export default function ImageViewer({ url, onClose }: ImageViewerProps) {
  return (
    <div className="fixed inset-0 z-[100] bg-black/90 flex flex-col items-center justify-center p-4">
      <button 
        onClick={onClose}
        className="absolute top-4 right-4 bg-white/10 p-2 rounded-full text-white hover:bg-white/20 transition"
      >
        <X className="w-6 h-6" />
      </button>
      
      <div className="w-full h-full flex items-center justify-center overflow-auto pt-16 pb-4">
        <img 
          src={url} 
          alt="Receipt" 
          className="max-w-full max-h-full object-contain rounded-lg"
        />
      </div>
    </div>
  );
}
