export type DrawingMode = 'blank' | 'overlay';

type DrawingTool = 'pen';

export interface Point {
    x: number;
    y: number;
}

export interface Stroke {
    points: Point[];
    color: string;
    width: number;
}

export interface CanvasConfig {
    mode: DrawingMode;
    baseImage?: string; // Base64 or URL for overlay mode
    width?: number;
    height?: number;
}

export interface ExportOptions {
    format: 'png' | 'jpeg';
    quality?: number;
    includeBackground?: boolean;
}

export interface ToolbarConfig {
    color: string;
    strokeWidth: number;
    tool: DrawingTool;
}
