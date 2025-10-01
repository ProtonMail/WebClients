import browser from '@proton/pass/lib/globals/browser';

import { getFramePath, getTabFrames } from './frames';

const getAllFrames = browser.webNavigation.getAllFrames as jest.Mock;
const tabId = 42;

describe('inline service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getTabFrames', () => {
        test('should handle main frame only', async () => {
            getAllFrames.mockResolvedValue([{ frameId: 0, parentFrameId: -1 }]);
            expect(await getTabFrames(tabId)).toEqual({ 0: { parent: null, frameId: 0 } });
            expect(getAllFrames).toHaveBeenCalledWith({ tabId });
        });

        test('should handle nested frames', async () => {
            getAllFrames.mockResolvedValue([
                { frameId: 0, parentFrameId: -1 },
                { frameId: 1, parentFrameId: 0 },
                { frameId: 2, parentFrameId: 1 },
            ]);

            expect(await getTabFrames(tabId)).toEqual({
                0: { parent: null, frameId: 0 },
                1: { parent: 0, frameId: 1 },
                2: { parent: 1, frameId: 2 },
            });
        });

        test('should handle multiple sibling frames', async () => {
            getAllFrames.mockResolvedValue([
                { frameId: 0, parentFrameId: -1 },
                { frameId: 1, parentFrameId: 0 },
                { frameId: 2, parentFrameId: 0 },
                { frameId: 3, parentFrameId: 0 },
            ]);

            expect(await getTabFrames(tabId)).toEqual({
                0: { parent: null, frameId: 0 },
                1: { parent: 0, frameId: 1 },
                2: { parent: 0, frameId: 2 },
                3: { parent: 0, frameId: 3 },
            });
        });

        test('should handle empty or null frames response', async () => {
            getAllFrames.mockResolvedValue(null);
            expect(await getTabFrames(tabId)).toEqual({});

            getAllFrames.mockResolvedValue([]);
            expect(await getTabFrames(tabId)).toEqual({});
        });
    });

    describe('getFramePath', () => {
        test('should return `[0]` for root frame', () => {
            const frames = { 0: { parent: null, frameId: 0 } };
            expect(getFramePath(frames, 0)).toEqual([0]);
        });

        test('should return complete path for direct child', () => {
            const frames = {
                0: { parent: null, frameId: 0 },
                1: { parent: 0, frameId: 1 },
            };

            expect(getFramePath(frames, 1)).toEqual([1, 0]);
        });

        test('should handle complex frame hierarchy', () => {
            const frames = {
                0: { parent: null, frameId: 0 },
                1: { parent: 0, frameId: 1 },
                2: { parent: 0, frameId: 2 },
                3: { parent: 1, frameId: 3 },
                4: { parent: 3, frameId: 4 },
            };
            expect(getFramePath(frames, 4)).toEqual([4, 3, 1, 0]);
            expect(getFramePath(frames, 2)).toEqual([2, 0]);
        });

        test('should return empty array for non-existent frame', () => {
            const frames = { 0: { parent: null, frameId: 0 } };
            expect(getFramePath(frames, 999)).toEqual([]);
        });

        test('should return partial path for orphaned frame', () => {
            const frames = {
                0: { parent: null, frameId: 0 },
                5: { parent: 3, frameId: 5 },
            };
            expect(getFramePath(frames, 5)).toEqual([5]);
        });
    });
});
