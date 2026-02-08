const TEMP_PREFIX = 'uploads-temp';
const PUBLIC_PREFIX = 'uploads-public';

export type ParsedTempObject = {
  uid: string;
  reportId: string;
  fileName: string;
};

export function buildTempObjectName(opts: { uid: string; reportId: string; fileExt: string }): string {
  const now = Date.now();
  return `${TEMP_PREFIX}/${opts.uid}/${opts.reportId}/${now}.${opts.fileExt}`;
}

export function parseTempObjectName(name: string): ParsedTempObject | null {
  const parts = name.split('/');
  if (parts.length !== 4) return null;
  const [prefix, uid, reportId, fileName] = parts;
  if (prefix !== TEMP_PREFIX || !uid || !reportId || !fileName) return null;
  return { uid, reportId, fileName };
}

export function tempToPublicObjectName(tempObjectName: string): string {
  return tempObjectName.replace(`${TEMP_PREFIX}/`, `${PUBLIC_PREFIX}/`).replace(/\.[a-zA-Z0-9]+$/, '.jpg');
}

export function buildPublicUrl(bucketName: string, publicObjectName: string): string {
  return `https://storage.googleapis.com/${bucketName}/${publicObjectName}`;
}

export function processedUploadDocId(tempObjectName: string): string {
  return Buffer.from(tempObjectName).toString('base64url');
}
