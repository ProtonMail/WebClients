// TODO: Replace legacy isPhotoGroup check with new SDK-based grouping logic
export const isPhotoGroup = (item: unknown): item is string => typeof item === 'string';
