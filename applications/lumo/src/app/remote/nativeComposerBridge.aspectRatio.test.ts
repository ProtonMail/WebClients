import { IMAGE_ASPECT_RATIOS } from '../types';
import {
    AspectRatio,
    DEFAULT_ASPECT_RATIO_KEY,
    aspectRatioKeyToImageRatio,
    imageRatioToAspectRatioKey,
} from './nativeComposerBridge';

// Locks the aspect-ratio contract crossing the native composer bridge. The web speaks
// colon form (`ImageAspectRatio`, e.g. '16:9'); native speaks underscore keys ('16_9').
// The `AspectRatio` object and both mapping helpers are derived from `IMAGE_ASPECT_RATIOS`,
// so a typo in the source tuple (or a parsing regression) surfaces here.

describe('native composer bridge aspect ratio', () => {
    describe('AspectRatio (computed map)', () => {
        it('derives width/height and colon ratio for every source entry', () => {
            expect(AspectRatio['16_9']).toEqual({ width: 16, height: 9, ratio: '16:9' });
            expect(AspectRatio['1_1']).toEqual({ width: 1, height: 1, ratio: '1:1' });
            expect(AspectRatio['9_16']).toEqual({ width: 9, height: 16, ratio: '9:16' });
        });

        it('has exactly one entry per source ratio', () => {
            expect(Object.keys(AspectRatio)).toHaveLength(IMAGE_ASPECT_RATIOS.length);
        });
    });

    describe('mapping helpers', () => {
        it('round-trips every ratio: ratio → key → ratio', () => {
            IMAGE_ASPECT_RATIOS.forEach((ratio) => {
                expect(aspectRatioKeyToImageRatio(imageRatioToAspectRatioKey(ratio))).toBe(ratio);
            });
        });

        it('falls back to the default key for an unknown ratio', () => {
            expect(imageRatioToAspectRatioKey('999:1' as any)).toBe(DEFAULT_ASPECT_RATIO_KEY);
        });

        it('falls back to the default ratio for an unknown key', () => {
            expect(aspectRatioKeyToImageRatio('999_1' as any)).toBe(AspectRatio[DEFAULT_ASPECT_RATIO_KEY].ratio);
        });
    });
});
