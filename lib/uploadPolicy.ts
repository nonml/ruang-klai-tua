export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export const ALLOWED_CONTENT_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'] as const;

const typeToExt = {
  'image/jpeg': ['jpg', 'jpeg'],
  'image/png': ['png'],
  'image/webp': ['webp'],
} as const;

export function normalizeExtension(ext: string): string {
  return ext.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function isAllowedUpload(contentType: string, fileExt: string): boolean {
  const ext = normalizeExtension(fileExt);
  if (!ALLOWED_CONTENT_TYPES.includes(contentType as any)) return false;
  if (!ALLOWED_EXTENSIONS.includes(ext as any)) return false;
  return (typeToExt as Record<string, readonly string[]>)[contentType]?.includes(ext) ?? false;
}
