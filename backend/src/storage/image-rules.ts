import { randomUUID } from 'node:crypto';
import type { ImageRule } from './storage.types.js';

export const TEAM_IMAGE_RULE: ImageRule = {
  allowedMimes: ['image/jpeg', 'image/png', 'image/webp'],
  maxBytes: 5 * 1024 * 1024,
  width: 1000,
  height: 1000,
  folder: 'team-members',
  crop: 'fill',
  gravity: 'face',
};

export const SPONSOR_IMAGE_RULE: ImageRule = {
  allowedMimes: ['image/jpeg', 'image/png', 'image/webp'],
  maxBytes: 5 * 1024 * 1024,
  width: 1000,
  height: 1000,
  folder: 'sponsors',
  crop: 'limit',
}

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

export const detectImageMime = (bytes: Buffer): string | undefined => {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return 'image/jpeg';
  }
  if (bytes.length >= 8 && bytes.subarray(0, 8).equals(PNG_SIGNATURE)) {
    return 'image/png';
  }
  if (
    bytes.length >= 12 &&
    bytes.toString('ascii', 0, 4) === 'RIFF' &&
    bytes.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return 'image/webp';
  }
  return undefined;
};

export const sanitizeFileName = (originalName: string): string =>
  originalName
    .normalize('NFKD')
    .replace(/[^a-zA-Z0-9_-]/g, '')
    .toLowerCase()
    .slice(0, 40);

export const buildPublicId = (
  rule: ImageRule,
  originalName: string,
): string => {
  const base = sanitizeFileName(originalName);
  return base
    ? `${rule.folder}/${base}-${randomUUID()}`
    : `${rule.folder}/${randomUUID()}`;
};
