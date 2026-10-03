'use client';

import { useState } from 'react';
import { createClient } from '../../lib/supabase/client';
import { resolveMediaUrl, buildPublicMediaUrl } from '../../lib/utils';
import {
  Upload,
  Image as ImageIcon,
  Video as VideoIcon,
  Trash2,
  ArrowLeft,
  ArrowRight,
  AlertTriangle,
  Loader2,
  CheckCircle,
} from 'lucide-react';

interface MediaManagerProps {
  images: string[];
  videoUrl: string | null;
  onImagesChange: (images: string[]) => void;
  onVideoChange: (videoUrl: string | null) => void;
  readOnly?: boolean;
}

export function MediaManager({
  images,
  videoUrl,
  onImagesChange,
  onVideoChange,
  readOnly = false,
}: MediaManagerProps) {
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [videoWarning, setVideoWarning] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const supabase = createClient();

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || readOnly) return;

    setUploadingImage(true);
    setErrorMessage(null);

    const newImages = [...images];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        setErrorMessage(`Invalid image format: ${file.name}. Only JPG, PNG, and WEBP are accepted.`);
        continue;
      }

      const cleanFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const filePath = `images/${Date.now()}_${cleanFileName}`;

      const { data, error } = await supabase.storage
        .from('property-media')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        setErrorMessage(`Failed to upload ${file.name}: ${error.message}`);
      } else if (data) {
        const fullUrl = buildPublicMediaUrl(data.path);
        newImages.push(fullUrl);
      }
    }

    onImagesChange(newImages);
    setUploadingImage(false);
    e.target.value = '';
  };

  const handleRemoveImage = (index: number) => {
    if (readOnly) return;
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
  };

  const handleMoveImage = (fromIndex: number, toIndex: number) => {
    if (readOnly || toIndex < 0 || toIndex >= images.length) return;
    const newImages = [...images];
    const [moved] = newImages.splice(fromIndex, 1);
    newImages.splice(toIndex, 0, moved);
    onImagesChange(newImages);
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || readOnly) return;

    setVideoWarning(null);
    setErrorMessage(null);

    // Validate video type
    const validVideoTypes = ['video/mp4', 'video/quicktime'];
    const isMovOrMp4 =
      validVideoTypes.includes(file.type) ||
      file.name.toLowerCase().endsWith('.mp4') ||
      file.name.toLowerCase().endsWith('.mov');

    if (!isMovOrMp4) {
      setErrorMessage('Invalid video format. Only MP4 and MOV files are accepted.');
      e.target.value = '';
      return;
    }

    // Hard block if > 50 MB
    const sizeInMB = file.size / (1024 * 1024);
    if (sizeInMB > 50) {
      setErrorMessage(`Video is ${sizeInMB.toFixed(1)} MB. Files over 50 MB cannot be uploaded.`);
      e.target.value = '';
      return;
    }

    // Warn if > 16 MB
    if (sizeInMB > 16) {
      setVideoWarning(
        `This video is ${sizeInMB.toFixed(1)} MB. WhatsApp handles videos under ~16 MB best. Compress first for smoother delivery.`
      );
    }

    setUploadingVideo(true);
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const filePath = `videos/${Date.now()}_${cleanFileName}`;

    const { data, error } = await supabase.storage
      .from('property-media')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      setErrorMessage(`Failed to upload video: ${error.message}`);
    } else if (data) {
      const fullUrl = buildPublicMediaUrl(data.path);
      onVideoChange(fullUrl);
    }

    setUploadingVideo(false);
    e.target.value = '';
  };

  const handleRemoveVideo = () => {
    if (readOnly) return;
    onVideoChange(null);
    setVideoWarning(null);
  };

  return (
    <div className="space-y-6">
      {errorMessage && (
        <div className="p-3 bg-coral-light border border-coral/30 rounded-xl text-xs text-coral">
          {errorMessage}
        </div>
      )}

      {/* --- Image Section --- */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div>
            <label className="block text-xs font-semibold text-ink">
              Property images
            </label>
            <p className="text-[11px] text-ink-muted">
              First image is the cover and is the one sent on WhatsApp. Drag or use arrows to reorder.
            </p>
          </div>
          {!readOnly && (
            <label className="cursor-pointer px-3 py-1.5 rounded-lg bg-surface border border-border hover:bg-seaglass text-xs font-medium text-ink flex items-center gap-1.5 transition">
              {uploadingImage ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-3.5 h-3.5" />
                  Upload images
                </>
              )}
              <input
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageUpload}
                disabled={uploadingImage}
                className="hidden"
              />
            </label>
          )}
        </div>

        {images.length === 0 ? (
          <div className="border border-dashed border-border rounded-xl p-8 text-center text-xs text-ink-muted bg-surface-subtle">
            <ImageIcon className="w-8 h-8 mx-auto text-ink-soft mb-2" />
            No images uploaded yet. Acceptable formats: JPG, PNG, WEBP.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {images.map((imgUrl, index) => {
              const resolved = resolveMediaUrl(imgUrl);
              const isCover = index === 0;

              return (
                <div
                  key={index}
                  className={`relative group rounded-xl overflow-hidden border bg-surface ${
                    isCover
                      ? 'border-creek ring-2 ring-creek/20'
                      : 'border-border'
                  }`}
                >
                  <img
                    src={resolved}
                    alt={`Property image ${index + 1}`}
                    className="w-full h-32 object-cover bg-seaglass"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src =
                        'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="%23999" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>';
                    }}
                  />

                  {/* Cover badge */}
                  {isCover && (
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-creek text-white text-[10px] font-bold shadow-xs">
                      Cover (WhatsApp)
                    </div>
                  )}

                  {/* Controls */}
                  {!readOnly && (
                    <div className="absolute inset-0 bg-ink/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-1.5 p-2">
                      {index > 0 && (
                        <button
                          type="button"
                          onClick={() => handleMoveImage(index, index - 1)}
                          className="p-1.5 rounded-lg bg-surface text-ink hover:bg-seaglass text-xs transition"
                          title="Move left (prioritize)"
                        >
                          <ArrowLeft className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {index < images.length - 1 && (
                        <button
                          type="button"
                          onClick={() => handleMoveImage(index, index + 1)}
                          className="p-1.5 rounded-lg bg-surface text-ink hover:bg-seaglass text-xs transition"
                          title="Move right"
                        >
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleRemoveImage(index)}
                        className="p-1.5 rounded-lg bg-coral text-white hover:bg-coral-hover text-xs transition"
                        title="Remove image"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* --- Video Section --- */}
      <div className="pt-4 border-t border-border">
        <div className="flex items-center justify-between mb-2">
          <div>
            <label className="block text-xs font-semibold text-ink">
              Property video tour
            </label>
            <p className="text-[11px] text-ink-muted">
              One video tour. WhatsApp handles videos under ~16 MB best. Maximum 50 MB (MP4, MOV).
            </p>
          </div>

          {!readOnly && (
            <label className="cursor-pointer px-3 py-1.5 rounded-lg bg-surface border border-border hover:bg-seaglass text-xs font-medium text-ink flex items-center gap-1.5 transition">
              {uploadingVideo ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-3.5 h-3.5" />
                  {videoUrl ? 'Replace video' : 'Upload video'}
                </>
              )}
              <input
                type="file"
                accept="video/mp4,video/quicktime"
                onChange={handleVideoUpload}
                disabled={uploadingVideo}
                className="hidden"
              />
            </label>
          )}
        </div>

        {videoWarning && (
          <div className="mb-3 p-3 bg-saffron-light border border-saffron/30 rounded-xl text-xs text-saffron-hover flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{videoWarning}</span>
          </div>
        )}

        {videoUrl ? (
          <div className="relative rounded-xl overflow-hidden border border-border bg-ink max-w-md">
            <video
              src={resolveMediaUrl(videoUrl)}
              controls
              className="w-full max-h-64 object-contain"
            />
            {!readOnly && (
              <button
                type="button"
                onClick={handleRemoveVideo}
                className="absolute top-2 right-2 px-2.5 py-1 rounded-md bg-coral text-white text-xs font-medium flex items-center gap-1 shadow-sm hover:bg-coral-hover transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Remove
              </button>
            )}
          </div>
        ) : (
          <div className="border border-dashed border-border rounded-xl p-6 text-center text-xs text-ink-muted bg-surface-subtle max-w-md">
            <VideoIcon className="w-8 h-8 mx-auto text-ink-soft mb-1.5" />
            No video uploaded.
          </div>
        )}
      </div>
    </div>
  );
}
