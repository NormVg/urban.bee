import type { Photo } from '@/hooks/use-photos';

/**
 * Hands photos taken on the in-app camera screen back to the report screen.
 * The report screen registers a callback and opens /camera; the camera
 * delivers what was taken when the person taps "Done".
 */
let waiting: ((photos: Photo[]) => void) | null = null;

export function awaitCapturedPhotos(onCaptured: (photos: Photo[]) => void): void {
  waiting = onCaptured;
}

export function deliverCapturedPhotos(photos: Photo[]): void {
  if (photos.length) waiting?.(photos);
  waiting = null;
}
