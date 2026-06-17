import type { SceneState } from '../types';
import { gridLayout } from './gridLayout';
import { screenShareSoloLayout } from './screenShareSoloLayout';
import { screenShareWithSidebarLayout } from './screenShareWithSidebarLayout';
import type { RecordingLayout } from './types';

// Order matters: the first layout whose `matches()` returns true wins.
// `gridLayout` is the catch-all fallback.
const LAYOUTS: RecordingLayout[] = [screenShareWithSidebarLayout, screenShareSoloLayout, gridLayout];

export const selectLayout = (scene: SceneState): RecordingLayout => {
    return LAYOUTS.find((layout) => layout.matches(scene)) ?? gridLayout;
};
