import { IMAGE_ASPECT_RATIOS } from '../types';
import {
    AVAILABLE_ASPECT_RATIOS,
    DEFAULT_ASPECT_RATIO_KEY,
    aspectRatioKeyToImageRatio,
    imageRatioToAspectRatioKey,
} from './nativeComposerBridge';

// Locks the aspect-ratio contract crossing the native composer bridge. The web speaks
// colon form (`ImageAspectRatio`, e.g. '16:9'); native speaks underscore keys ('16_9').
// `AVAILABLE_ASPECT_RATIOS` and both mapping helpers are derived from `IMAGE_ASPECT_RATIOS`,
// so a typo in the source tuple (or a parsing regression) surfaces here.

describe('native composer bridge aspect ratio', () => {
    describe('AVAILABLE_ASPECT_RATIOS (computed list)', () => {
        it('derives width/height and colon ratio for every source entry', () => {
            expect(AVAILABLE_ASPECT_RATIOS).toEqual([
                { key: '1_1', width: 1, height: 1, ratio: '1:1' },
                { key: '2_3', width: 2, height: 3, ratio: '2:3' },
                { key: '3_2', width: 3, height: 2, ratio: '3:2' },
                { key: '9_16', width: 9, height: 16, ratio: '9:16' },
                { key: '16_9', width: 16, height: 9, ratio: '16:9' },
            ]);
        });

        it('has exactly one entry per source ratio', () => {
            expect(AVAILABLE_ASPECT_RATIOS).toHaveLength(IMAGE_ASPECT_RATIOS.length);
        });

        // The reason this is a list rather than a keyed object: native renders these in
        // order, and an object's key order does not survive the bridge (WebKit hands iOS
        // an unordered NSDictionary). Locking the order here makes that contract explicit.
        it('preserves the source order, which native renders top to bottom', () => {
            expect(AVAILABLE_ASPECT_RATIOS.map((info) => info.ratio)).toEqual([...IMAGE_ASPECT_RATIOS]);
        });

        // The key is what native passes back to `changeAspectRatio`, so it travels with
        // each entry rather than being reconstructed on the other side.
        it('carries the underscore key native sends back', () => {
            expect(AVAILABLE_ASPECT_RATIOS.map((info) => info.key)).toEqual(
                IMAGE_ASPECT_RATIOS.map((ratio) => ratio.replace(':', '_'))
            );
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
            expect(aspectRatioKeyToImageRatio('999_1' as any)).toBe(
                aspectRatioKeyToImageRatio(DEFAULT_ASPECT_RATIO_KEY)
            );
        });
    });
});
