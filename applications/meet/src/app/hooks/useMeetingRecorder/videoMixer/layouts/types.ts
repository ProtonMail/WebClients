import type { SceneState } from '../types';

export interface LayoutDrawContext {
    ctx: OffscreenCanvasRenderingContext2D;
    canvas: OffscreenCanvas;
    scene: SceneState;
    videoFrames: Map<string, VideoFrame | ImageBitmap>;
}

// A recording layout decides how participants and shared content are arranged
// on the recording canvas. Layouts are chosen based on the current scene
// (e.g. screen-share present, regular grid). Add a new layout by implementing
// this interface and registering it in `selectLayout.ts`.
export interface RecordingLayout {
    id: string;
    matches(scene: SceneState): boolean;
    draw(context: LayoutDrawContext): void;
}

export const screenShareKeyFor = (identity: string) => `${identity}-screenshare`;
