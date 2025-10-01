import browser from '@proton/pass/lib/globals/browser';

import { getTabFrames } from './frames';

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
});
