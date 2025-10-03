import browser from '@proton/pass/lib/globals/browser';

import { createInlineService } from './inline';

const tabsSendMessage = browser.tabs.sendMessage as jest.Mock;

const tabId = 42;
const frameAttributes = { src: 'https://example.com/iframe', width: 400, height: 300 };

describe('inline service', () => {
    const service = createInlineService();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('queryFrame', () => {
        test('should query parent frame correctly', async () => {
            const response = { ok: true, coords: { top: 25, left: 50 }, frameAttributes };
            tabsSendMessage.mockResolvedValue(response);
            expect(await service.queryFrame(tabId, { frameId: 2, parent: 1, origin: null }, frameAttributes)).toBe(
                response
            );

            expect(tabsSendMessage).toHaveBeenCalledWith(
                tabId,
                expect.objectContaining({
                    type: 'FRAME_QUERY',
                    payload: {
                        frameId: 2,
                        parentFrameId: 1,
                        frameAttributes,
                    },
                }),
                { frameId: 1 }
            );
        });
    });

    describe('getFrameCoords', () => {
        beforeEach(() => {
            tabsSendMessage.mockResolvedValue({
                ok: true,
                coords: { top: 10, left: 20 },
                frameAttributes,
            });
        });

        test('should handle main frame (frameId 0)', async () => {
            const frames = new Map([[0, { parent: null, frameId: 0, origin: null }]]);
            const result = await service.getFrameCoords(
                tabId,
                0,
                {
                    coords: { top: 100, left: 200 },
                    frameAttributes,
                },
                frames
            );

            expect(result).toEqual({
                frame: { parent: null, frameId: 0, origin: null },
                frameAttributes,
                coords: { top: 110, left: 220 },
            });
        });

        test('should handle nested frames with coordinate accumulation', async () => {
            /*
            <frame origin="example.com">       <!-- frame0 -->
                <frame origin="example.com">   <!-- frame1 -->
                    <frame origin="example.com" /> <!-- frame2 -->
                </frame>
            </frame>
            */
            const frames = new Map([
                [0, { parent: null, frameId: 0, origin: null }],
                [1, { parent: 0, frameId: 1, origin: null }],
                [2, { parent: 1, frameId: 2, origin: null }],
            ]);

            tabsSendMessage
                /** Frame 2 -> Frame 1 offset */
                .mockResolvedValueOnce({
                    ok: true,
                    coords: { top: 15, left: 25 },
                    frameAttributes,
                })
                /** Frame 1 -> Frame 0 offset */
                .mockResolvedValueOnce({
                    ok: true,
                    coords: { top: 30, left: 35 },
                    frameAttributes,
                });

            /** Starting coordinate accumulation in Frame 2 */
            const result = await service.getFrameCoords(
                tabId,
                2,
                {
                    coords: { top: 5, left: 10 },
                    frameAttributes,
                },
                frames
            );

            /** Coordinate accumulation: 5+15+30=50, 10+25+35=70
             * Stops at Frame 1 (parent is Frame 0, the main frame) */
            expect(result).toEqual({
                frame: { parent: 0, frameId: 1, origin: null },
                frameAttributes,
                coords: { top: 50, left: 70 },
            });
        });

        test('should return `null` when frame not found in hierarchy', async () => {
            /*
            <frame origin="example.com">       <!-- frame0 -->
                <frame origin="example.com" />   <!-- frame1 -->
            </frame>
            */
            const frames = new Map([
                [0, { parent: null, frameId: 0, origin: null }],
                [1, { parent: 0, frameId: 1, origin: null }],
            ]);

            const query = { coords: { top: 50, left: 75 }, frameAttributes };
            expect(await service.getFrameCoords(tabId, 999, query, frames)).toBeNull();
        });

        test('should return `null` when frame query fails', async () => {
            /*
            <frame origin="example.com">       <!-- frame0 -->
                <frame origin="example.com" />   <!-- frame1 -->
            </frame>
            */
            const frames = new Map([
                [0, { parent: null, frameId: 0, origin: null }],
                [1, { parent: 0, frameId: 1, origin: null }],
            ]);

            const query = { coords: { top: 50, left: 75 }, frameAttributes };
            tabsSendMessage.mockResolvedValue({ ok: false });
            expect(await service.getFrameCoords(tabId, 1, query, frames)).toBeNull();
        });

        test('should return null when frames parameter is empty', async () => {
            const frames = new Map();
            const query = { coords: { top: 50, left: 75 }, frameAttributes };
            expect(await service.getFrameCoords(tabId, 1, query, frames)).toBeNull();
        });
    });
});
