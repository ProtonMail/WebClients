// Based on Firefox zoom factor list
export const ZOOM_FACTOR_LIST = [
    0.3, 0.5, 0.67, 0.8, 0.9, 1.0, 1.1, 1.2, 1.33, 1.5, 1.7, 2.0, 2.4, 3.0, 4.0, 5.0,
] as const;
export type ZoomFactor = (typeof ZOOM_FACTOR_LIST)[number];
export const DEFAULT_ZOOM_FACTOR: ZoomFactor = 1.0;
