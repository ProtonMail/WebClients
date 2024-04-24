import type { PhotoGroup } from '../interface';

export const isPhotoGroup = (item: unknown): item is PhotoGroup => typeof item === 'string';
