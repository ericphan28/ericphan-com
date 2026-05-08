'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  Loader2,
  Save,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  Crop,
  Palette,
  Download,
  Undo,
} from 'lucide-react';
import { useFileManagerContext } from '../../FileManagerProvider';
import { FileItem } from '../../types';

interface ImageEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  file: FileItem;
  onSuccess?: () => void;
}

interface ImageState {
  brightness: number;
  contrast: number;
  saturation: number;
  rotation: number;
  flipX: boolean;
  flipY: boolean;
  filter: string;
}

/**
 * Dialog chỉnh sửa ảnh với Canvas
 * 
 * Features:
 * - Brightness/Contrast/Saturation controls
 * - Rotate image (90 deg increments)
 * - Flip horizontal/vertical
 * - CSS filters (grayscale, sepia, blur, etc.)
 * - Save edited image
 * - Download edited image
 * - Undo changes
 */
export function ImageEditorDialog({
  open,
  onOpenChange,
  file,
  onSuccess,
}: ImageEditorDialogProps) {
  const { config, supabase } = useFileManagerContext();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [originalImage, setOriginalImage] = useState<HTMLImageElement | null>(null);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imageState, setImageState] = useState<ImageState>({
    brightness: 100,
    contrast: 100,
    saturation: 100,
    rotation: 0,
    flipX: false,
    flipY: false,
    filter: 'none',
  });

  // Kiểm tra feature flag
  if (!config.features.imageEditor) {
    return null;
  }

  // Load image
  useEffect(() => {
    if (open && file.path) {
      loadImage();
    }
  }, [open, file.path]);

  // Redraw canvas when state changes
  useEffect(() => {
    if (originalImage && canvasRef.current) {
      drawImage();
    }
  }, [imageState, originalImage]);

  const loadImage = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.storage
        .from(config.bucketName)
        .download(file.path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        setOriginalImage(img);
        URL.revokeObjectURL(url);
        setLoading(false);
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        throw new Error('Failed to load image');
      };

      img.src = url;
    } catch (error) {
      console.error('Lỗi khi tải ảnh:', error);
      config.callbacks?.onError?.(error as Error, 'load_image');

      toast({
        title: 'Lỗi',
        description: 'Không thể tải ảnh',
        variant: 'destructive',
      });
      setLoading(false);
    }
  };

  // Draw image on canvas with current state
  const drawImage = () => {
    const canvas = canvasRef.current;
    const img = originalImage;
    if (!canvas || !img) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle rotation - swap dimensions if 90 or 270 degrees
    const isRotated = imageState.rotation === 90 || imageState.rotation === 270;
    const canvasWidth = isRotated ? img.height : img.width;
    const canvasHeight = isRotated ? img.width : img.height;

    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    // Clear canvas
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Save context state
    ctx.save();

    // Move to center
    ctx.translate(canvasWidth / 2, canvasHeight / 2);

    // Apply rotation
    ctx.rotate((imageState.rotation * Math.PI) / 180);

    // Apply flip
    ctx.scale(
      imageState.flipX ? -1 : 1,
      imageState.flipY ? -1 : 1
    );

    // Build filter string
    const filters: string[] = [];
    
    if (imageState.brightness !== 100) {
      filters.push(`brightness(${imageState.brightness}%)`);
    }
    if (imageState.contrast !== 100) {
      filters.push(`contrast(${imageState.contrast}%)`);
    }
    if (imageState.saturation !== 100) {
      filters.push(`saturate(${imageState.saturation}%)`);
    }

    if (imageState.filter !== 'none') {
      switch (imageState.filter) {
        case 'grayscale':
          filters.push('grayscale(100%)');
          break;
        case 'sepia':
          filters.push('sepia(100%)');
          break;
        case 'blur':
          filters.push('blur(3px)');
          break;
        case 'invert':
          filters.push('invert(100%)');
          break;
      }
    }

    // Áp dụng filter vào ctx.filter (bake vào pixels, không dùng canvas.style.filter)
    // ctx.filter được hỗ trợ trên hầu hết browsers hiện đại
    ctx.filter = filters.length > 0 ? filters.join(' ') : 'none';
    // Xóa CSS filter cũ nếu có
    canvas.style.filter = 'none';

    // Draw image centered (sau khi set ctx.filter)
    ctx.drawImage(img, -img.width / 2, -img.height / 2);

    // Restore context
    ctx.restore();
  };

  // Update state
  const updateState = <K extends keyof ImageState>(
    key: K,
    value: ImageState[K]
  ) => {
    setImageState((prev) => ({ ...prev, [key]: value }));
  };

  // Rotate image
  const rotate = () => {
    updateState('rotation', (imageState.rotation + 90) % 360);
  };

  // Reset all edits
  const resetEdits = () => {
    setImageState({
      brightness: 100,
      contrast: 100,
      saturation: 100,
      rotation: 0,
      flipX: false,
      flipY: false,
      filter: 'none',
    });
  };

  // Save edited image
  const saveImage = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setSaving(true);
    try {
      // Convert canvas to blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((b) => {
          if (b) resolve(b);
          else reject(new Error('Failed to create blob'));
        }, file.metadata?.mimetype || 'image/png');
      });

      // Upload edited image (replace original)
      const { error } = await supabase.storage
        .from(config.bucketName)
        .update(file.path, blob, {
          contentType: file.metadata?.mimetype || 'image/png',
          upsert: true,
        });

      if (error) throw error;

      toast({
        title: 'Đã lưu',
        description: 'Ảnh đã được cập nhật',
      });

      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Lỗi khi lưu ảnh:', error);
      config.callbacks?.onError?.(error as Error, 'save_image');

      toast({
        title: 'Lỗi',
        description: 'Không thể lưu ảnh',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  // Download edited image
  const downloadImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.toBlob((blob) => {
      if (!blob) return;

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `edited_${file.name}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: 'Đang tải xuống',
        description: `edited_${file.name}`,
      });
    }, file.metadata?.mimetype || 'image/png');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[95vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Chỉnh Sửa Ảnh: {file.name}
          </DialogTitle>
          <DialogDescription>
            Điều chỉnh độ sáng, độ tương phản, xoay và áp dụng filters
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex gap-4 overflow-hidden">
          {/* Canvas preview */}
          <div className="flex-1 flex items-center justify-center bg-muted/30 rounded-lg overflow-auto p-4">
            {loading ? (
              <div className="flex items-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <span className="text-muted-foreground">Đang tải ảnh...</span>
              </div>
            ) : (
              <canvas
                ref={canvasRef}
                className="max-w-full max-h-full shadow-lg"
              />
            )}
          </div>

          {/* Controls */}
          <div className="w-80 space-y-5 overflow-y-auto">
            {/* Brightness */}
            <div className="space-y-2">
              <Label>Độ sáng: {imageState.brightness}%</Label>
              <Slider
                value={[imageState.brightness]}
                onValueChange={(v) => updateState('brightness', v[0])}
                min={0}
                max={200}
                step={1}
              />
            </div>

            {/* Contrast */}
            <div className="space-y-2">
              <Label>Độ tương phản: {imageState.contrast}%</Label>
              <Slider
                value={[imageState.contrast]}
                onValueChange={(v) => updateState('contrast', v[0])}
                min={0}
                max={200}
                step={1}
              />
            </div>

            {/* Saturation */}
            <div className="space-y-2">
              <Label>Độ bão hòa: {imageState.saturation}%</Label>
              <Slider
                value={[imageState.saturation]}
                onValueChange={(v) => updateState('saturation', v[0])}
                min={0}
                max={200}
                step={1}
              />
            </div>

            {/* Filter */}
            <div className="space-y-2">
              <Label>Filter</Label>
              <Select
                value={imageState.filter}
                onValueChange={(v) => updateState('filter', v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Không có</SelectItem>
                  <SelectItem value="grayscale">Grayscale (Đen trắng)</SelectItem>
                  <SelectItem value="sepia">Sepia (Nâu cổ điển)</SelectItem>
                  <SelectItem value="blur">Blur (Mờ)</SelectItem>
                  <SelectItem value="invert">Invert (Đảo màu)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Transform buttons */}
            <div className="space-y-2">
              <Label>Biến đổi</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  onClick={rotate}
                  className="w-full"
                >
                  <RotateCw className="mr-2 h-4 w-4" />
                  Xoay 90°
                </Button>
                <Button
                  variant="outline"
                  onClick={() => updateState('flipX', !imageState.flipX)}
                  className="w-full"
                >
                  <FlipHorizontal className="mr-2 h-4 w-4" />
                  Lật ngang
                </Button>
                <Button
                  variant="outline"
                  onClick={() => updateState('flipY', !imageState.flipY)}
                  className="w-full col-span-2"
                >
                  <FlipVertical className="mr-2 h-4 w-4" />
                  Lật dọc
                </Button>
              </div>
            </div>

            {/* Reset button */}
            <Button
              variant="outline"
              onClick={resetEdits}
              className="w-full"
            >
              <Undo className="mr-2 h-4 w-4" />
              Hoàn tác tất cả
            </Button>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={downloadImage}
            disabled={loading}
          >
            <Download className="mr-2 h-4 w-4" />
            Tải Xuống
          </Button>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Hủy
          </Button>
          <Button onClick={saveImage} disabled={loading || saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Save className="mr-2 h-4 w-4" />
            {saving ? 'Đang lưu...' : 'Lưu'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
