import browser from '@proton/pass/lib/globals/browser';

import { getAutofillableFrameIDs, getFramePath, getTabFrames, validateFramePath } from './frames';

const getAllFrames = browser.webNavigation.getAllFrames as jest.Mock;
const tabId = 42;

describe('inline service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getTabFrames', () => {
        test('should handle main frame only', async () => {
            getAllFrames.mockResolvedValue([{ frameId: 0, parentFrameId: -1 }]);
            expect(await getTabFrames(tabId)).toEqual(new Map([[0, { parent: null, frameId: 0, origin: null }]]));
            expect(getAllFrames).toHaveBeenCalledWith({ tabId });
        });

        test('should handle nested frames', async () => {
            getAllFrames.mockResolvedValue([
                { frameId: 0, parentFrameId: -1 },
                { frameId: 1, parentFrameId: 0 },
                { frameId: 2, parentFrameId: 1 },
            ]);

            expect(await getTabFrames(tabId)).toEqual(
                new Map([
                    [0, { parent: null, frameId: 0, origin: null }],
                    [1, { parent: 0, frameId: 1, origin: null }],
                    [2, { parent: 1, frameId: 2, origin: null }],
                ])
            );
        });

        test('should handle multiple sibling frames', async () => {
            getAllFrames.mockResolvedValue([
                { frameId: 0, parentFrameId: -1 },
                { frameId: 1, parentFrameId: 0 },
                { frameId: 2, parentFrameId: 0 },
                { frameId: 3, parentFrameId: 0 },
            ]);

            expect(await getTabFrames(tabId)).toEqual(
                new Map([
                    [0, { parent: null, frameId: 0, origin: null }],
                    [1, { parent: 0, frameId: 1, origin: null }],
                    [2, { parent: 0, frameId: 2, origin: null }],
                    [3, { parent: 0, frameId: 3, origin: null }],
                ])
            );
        });

        test('should handle empty or null frames response', async () => {
            getAllFrames.mockResolvedValue(null);
            expect(await getTabFrames(tabId)).toEqual(new Map());

            getAllFrames.mockResolvedValue([]);
            expect(await getTabFrames(tabId)).toEqual(new Map());
        });
    });

    describe('getFramePath', () => {
        test('should return `[0]` for root frame', () => {
            const frames = new Map([[0, { parent: null, frameId: 0, origin: null }]]);
            expect(getFramePath(frames, 0)).toEqual([0]);
        });

        test('should return complete path for direct child', () => {
            const frames = new Map([
                [0, { parent: null, frameId: 0, origin: null }],
                [1, { parent: 0, frameId: 1, origin: null }],
            ]);

            expect(getFramePath(frames, 1)).toEqual([1, 0]);
        });

        test('should handle complex frame hierarchy', () => {
            const frames = new Map([
                [0, { parent: null, frameId: 0, origin: null }],
                [1, { parent: 0, frameId: 1, origin: null }],
                [2, { parent: 0, frameId: 2, origin: null }],
                [3, { parent: 1, frameId: 3, origin: null }],
                [4, { parent: 3, frameId: 4, origin: null }],
            ]);
            expect(getFramePath(frames, 4)).toEqual([4, 3, 1, 0]);
            expect(getFramePath(frames, 2)).toEqual([2, 0]);
        });

        test('should return empty array for non-existent frame', () => {
            const frames = new Map([[0, { parent: null, frameId: 0, origin: null }]]);
            expect(getFramePath(frames, 999)).toEqual([]);
        });

        test('should return partial path for orphaned frame', () => {
            const frames = new Map([
                [0, { parent: null, frameId: 0, origin: null }],
                [5, { parent: 3, frameId: 5, origin: null }],
            ]);
            expect(getFramePath(frames, 5)).toEqual([5]);
        });
    });

    describe('validateFramePath', () => {
        /*
        <frame origin="merchant.com">           <!-- frame0 -->
            <frame origin="malicious.com">      <!-- frame1 -->
                <frame origin="payment.com" />  <!-- frame2 -->
            </frame>
            <frame origin="payment.com" />      <!-- frame3 -->
        </frame>
        */
        const frames = new Map([
            [0, { parent: null, frameId: 0, origin: 'merchant.com' }],
            [1, { parent: 0, frameId: 1, origin: 'malicious.com' }],
            [2, { parent: 1, frameId: 2, origin: 'payment.com' }],
            [3, { parent: 0, frameId: 3, origin: 'payment.com' }],
        ]);

        test('should allow frame with trusted path', () => {
            const allowedOrigins = ['payment.com', 'merchant.com'];
            expect(validateFramePath(frames, 3, allowedOrigins)).toBe(true);
        });

        test('should reject frame with malicious intermediate origin', () => {
            const allowedOrigins = ['payment.com', 'merchant.com'];
            expect(validateFramePath(frames, 2, allowedOrigins)).toBe(false);
        });

        test('should handle root frame validation', () => {
            const allowedOrigins = ['merchant.com'];
            expect(validateFramePath(frames, 0, allowedOrigins)).toBe(true);
        });

        test('should reject frame with unknown origin in path', () => {
            const allowedOrigins = ['payment.com'];
            expect(validateFramePath(frames, 3, allowedOrigins)).toBe(false);
        });
    });

    describe('getAutofillableFrameIDs', () => {
        test('should filter frames by origin when triggered from top frame', async () => {
            /*
            <frame origin="example.com">          <!-- frame0 -->
                <frame origin="example.com" />    <!-- frame1 -->
                <frame origin="evil.com" />       <!-- frame2 -->
                <frame origin="example.com" />    <!-- frame3 -->
                <frame origin="phishing.com" />   <!-- frame4 -->
            </frame>
            */
            getAllFrames.mockResolvedValue([
                { frameId: 0, parentFrameId: -1, url: 'https://example.com/page' },
                { frameId: 1, parentFrameId: 0, url: 'https://example.com/iframe' },
                { frameId: 2, parentFrameId: 0, url: 'https://evil.com/malicious' },
                { frameId: 3, parentFrameId: 0, url: 'https://example.com/checkout' },
                { frameId: 4, parentFrameId: 0, url: 'https://phishing.com/fake' },
            ]);

            const result = await getAutofillableFrameIDs(tabId, 'example.com', 0);

            expect(result).toEqual([
                { frameId: 0, crossOrigin: false },
                { frameId: 1, crossOrigin: false },
                { frameId: 3, crossOrigin: false },
            ]);
        });

        test('should include top-level origin when triggered from subframe', async () => {
            /*
            <frame origin="shop.com">            <!-- frame0 -->
                <frame origin="payments.com" />  <!-- frame1 -->
                <frame origin="evil.com" />      <!-- frame2 -->
            </frame>
            */
            getAllFrames.mockResolvedValue([
                { frameId: 0, parentFrameId: -1, url: 'https://shop.com/checkout' },
                { frameId: 1, parentFrameId: 0, url: 'https://payments.com/widget' },
                { frameId: 2, parentFrameId: 0, url: 'https://evil.com/malicious' },
            ]);

            const result = await getAutofillableFrameIDs(tabId, 'payments.com', 1);

            expect(result).toEqual([
                { frameId: 0, crossOrigin: true },
                { frameId: 1, crossOrigin: false },
            ]);
        });

        test('should handle frames with unparseable URLs', async () => {
            /*
            <frame origin="example.com">          <!-- frame0 -->
                <frame origin="about:blank" />    <!-- frame1 -->
                <frame origin="javascript:" />    <!-- frame2 -->
                <frame origin="example.com" />    <!-- frame3 -->
            </frame>
            */
            getAllFrames.mockResolvedValue([
                { frameId: 0, parentFrameId: -1, url: 'https://example.com/page' },
                { frameId: 1, parentFrameId: 0, url: 'about:blank' },
                { frameId: 2, parentFrameId: 0, url: 'javascript:void(0)' },
                { frameId: 3, parentFrameId: 0, url: 'https://example.com/valid' },
            ]);

            const result = await getAutofillableFrameIDs(tabId, 'example.com', 0);

            expect(result).toEqual([
                { frameId: 0, crossOrigin: false },
                { frameId: 3, crossOrigin: false },
            ]);
        });

        test('should handle empty or null frame responses', async () => {
            getAllFrames.mockResolvedValue(null);
            expect(await getAutofillableFrameIDs(tabId, 'example.com', 0)).toEqual([]);

            getAllFrames.mockResolvedValue([]);
            expect(await getAutofillableFrameIDs(tabId, 'example.com', 0)).toEqual([]);
        });

        test('should handle complex nested frame hierarchy with mixed origins', async () => {
            /*
            <frame origin="shop.com">                <!-- frame0 -->
                <frame origin="shop.com">            <!-- frame1 -->
                    <frame origin="payments.com">    <!-- frame2 -->
                        <frame origin="ads.com" />   <!-- frame3 -->
                    </frame>
                </frame>
                <frame origin="payments.com">        <!-- frame4 -->
                    <frame origin="shop.com" />      <!-- frame5 -->
                </frame>
            </frame>
            */
            getAllFrames.mockResolvedValue([
                { frameId: 0, parentFrameId: -1, url: 'https://shop.com/product' },
                { frameId: 1, parentFrameId: 0, url: 'https://shop.com/reviews' },
                { frameId: 2, parentFrameId: 1, url: 'https://payments.com/checkout' },
                { frameId: 3, parentFrameId: 2, url: 'https://ads.com/banner' },
                { frameId: 4, parentFrameId: 0, url: 'https://payments.com/form' },
                { frameId: 5, parentFrameId: 4, url: 'https://shop.com/support' },
            ]);

            const result = await getAutofillableFrameIDs(tabId, 'payments.com', 2);

            expect(result).toEqual([
                { frameId: 0, crossOrigin: true },
                { frameId: 1, crossOrigin: true },
                { frameId: 2, crossOrigin: false },
                { frameId: 4, crossOrigin: false },
                { frameId: 5, crossOrigin: true },
            ]);
        });

        test('should not allow cross-origin when no top-level context available', async () => {
            /*
               <!-- No main frame (frameId 0) availables (orphans) -->
               <frame origin="payments.com" />        <!-- frame1 -->
               <frame origin="shop.com" />            <!-- frame2 -->
            */
            getAllFrames.mockResolvedValue([
                { frameId: 1, parentFrameId: 0, url: 'https://payments.com/widget' },
                { frameId: 2, parentFrameId: 0, url: 'https://shop.com/page' },
            ]);

            const result = await getAutofillableFrameIDs(tabId, 'payments.com', 1);
            expect(result).toEqual([]);
        });

        test('should handle subdomain scenarios correctly', async () => {
            /*
            <frame origin="example.com">          <!-- frame0 -->
                <frame origin="example.com" />    <!-- frame1 -->
            </frame>
            */
            getAllFrames.mockResolvedValue([
                { frameId: 0, parentFrameId: -1, url: 'https://www.example.com/page' },
                { frameId: 1, parentFrameId: 0, url: 'https://api.example.com/widget' },
            ]);

            const result = await getAutofillableFrameIDs(tabId, 'example.com', 1);

            expect(result).toEqual([
                { frameId: 0, crossOrigin: false },
                { frameId: 1, crossOrigin: false },
            ]);
        });

        test('should prevent malicious frame chain injection attack', async () => {
            /*
            <frame origin="merchant.com">            <!-- frame0 -->
                <frame origin="malicious.com">       <!-- frame1 -->
                    <frame origin="payment.com" />   <!-- frame2 -->
                </frame>
                <frame origin="payment.com" />       <!-- frame3 -->
            </frame>
            */
            getAllFrames.mockResolvedValue([
                { frameId: 0, parentFrameId: -1, url: 'https://merchant.com/checkout' },
                { frameId: 1, parentFrameId: 0, url: 'https://malicious.com/inject' },
                { frameId: 2, parentFrameId: 1, url: 'https://payment.com/form' },
                { frameId: 3, parentFrameId: 0, url: 'https://payment.com/widget' },
            ]);

            /**  Autofill triggered from frame2 (payment.com via malicious chain) */
            const result = await getAutofillableFrameIDs(tabId, 'payment.com', 2);

            expect(result).toEqual([
                { frameId: 0, crossOrigin: true },
                { frameId: 3, crossOrigin: false },
            ]);
        });

        test('should validate complete frame chain for deeply nested frames', async () => {
            /*
            <frame origin="shop.com">                  <!-- frame0 -->
                <frame origin="shop.com">              <!-- frame1 -->
                    <frame origin="payment.com">       <!-- frame2 -->
                        <frame origin="payment.com" /> <!-- frame3 GOOD PATH -->
                    </frame>
                </frame>
                <frame origin="malicious.com">         <!-- frame4 -->
                    <frame origin="payment.com" />     <!-- frame5 BAD PATH -->
                </frame>
            </frame>
            */
            getAllFrames.mockResolvedValue([
                { frameId: 0, parentFrameId: -1, url: 'https://shop.com/page' },
                { frameId: 1, parentFrameId: 0, url: 'https://shop.com/reviews' },
                { frameId: 2, parentFrameId: 1, url: 'https://payment.com/checkout' },
                { frameId: 3, parentFrameId: 2, url: 'https://payment.com/form' },
                { frameId: 4, parentFrameId: 0, url: 'https://malicious.com/ad' },
                { frameId: 5, parentFrameId: 4, url: 'https://payment.com/fake' },
            ]);

            const result = await getAutofillableFrameIDs(tabId, 'payment.com', 2);

            expect(result).toEqual([
                { frameId: 0, crossOrigin: true },
                { frameId: 1, crossOrigin: true },
                { frameId: 2, crossOrigin: false },
                { frameId: 3, crossOrigin: false },
            ]);
        });

        test('should handle complex legitimate multi-origin scenarios', async () => {
            /*
            <frame origin="store.com">               <!-- frame0 -->
                <frame origin="stripe.com">          <!-- frame1 -->
                    <frame origin="stripe.com" />    <!-- frame2 -->
                </frame>
                <frame origin="store.com" />         <!-- frame3 -->
            </frame>
            */
            getAllFrames.mockResolvedValue([
                { frameId: 0, parentFrameId: -1, url: 'https://store.com/checkout' },
                { frameId: 1, parentFrameId: 0, url: 'https://payments.stripe.com/widget' },
                { frameId: 2, parentFrameId: 1, url: 'https://js.stripe.com/form' },
                { frameId: 3, parentFrameId: 0, url: 'https://cdn.store.com/assets' },
            ]);

            const result = await getAutofillableFrameIDs(tabId, 'stripe.com', 1);

            expect(result).toEqual([
                { frameId: 0, crossOrigin: true },
                { frameId: 1, crossOrigin: false },
                { frameId: 2, crossOrigin: false },
                { frameId: 3, crossOrigin: true },
            ]);
        });

        test('should reject frames with broken parent chains', async () => {
            /*
            <frame origin="example.com">            <!-- frame0 -->
                <frame origin="example.com" />      <!-- frame1 -->
            </frame>
            <frame origin="example.com">            <!-- frame5 ORPHANED -->
                <frame origin="example.com" />      <!-- frame6 BROKEN CHAIN -->
            </frame>
            */
            getAllFrames.mockResolvedValue([
                { frameId: 0, parentFrameId: -1, url: 'https://example.com/page' },
                { frameId: 1, parentFrameId: 0, url: 'https://example.com/iframe' },
                { frameId: 5, parentFrameId: 3, url: 'https://example.com/orphaned' },
                { frameId: 6, parentFrameId: 5, url: 'https://example.com/nested' },
            ]);

            const result = await getAutofillableFrameIDs(tabId, 'example.com', 0);

            expect(result).toEqual([
                { frameId: 0, crossOrigin: false },
                { frameId: 1, crossOrigin: false },
            ]);
        });
    });
});
