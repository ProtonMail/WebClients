import { fromChunks, toChunks } from './chunk';

const TEST_CHUNK_SIZE = 1024; /* 1Kb */

describe('State chunking utilities', () => {
    const createMockData = (size: number = 1000) => ({
        items: Array.from({ length: size }).map((_, i) => ({
            id: `item-${i}`,
            value: `test-value-${i}`,
        })),
    });

    describe('`toChunks`', () => {
        test('should chunk state into appropriate number of chunks', () => {
            const state = createMockData();
            const chunks = Array.from(toChunks(state, TEST_CHUNK_SIZE));

            expect(chunks.length).toBeGreaterThan(1);
            expect(chunks[0].total).toBe(chunks.length);
            expect(chunks[0].index).toBe(0);
            expect(chunks[chunks.length - 1].index).toBe(chunks.length - 1);
        });

        test('should use the same `streamID` & `total` for all chunks in a batch', () => {
            const state = createMockData();
            const chunks = Array.from(toChunks(state, TEST_CHUNK_SIZE));

            const uniqueIds = new Set(chunks.map((chunk) => chunk.streamID));
            const uniqueTotals = new Set(chunks.map((chunk) => chunk.total));
            expect(uniqueIds.size).toBe(1);
            expect(uniqueTotals.size).toBe(1);
        });

        test('should respect the specified chunk size', () => {
            const state = createMockData(100);
            const chunks = Array.from(toChunks(state, TEST_CHUNK_SIZE));
            /** All chunks except possibly the last one should be of the specified size */
            chunks.slice(0, -1).forEach((chunk) => expect(chunk.size).toBe(TEST_CHUNK_SIZE));
        });
    });

    describe('`fromChunks`', () => {
        test('should reconstruct object from chunks', () => {
            const original = createMockData();
            const chunks = Array.from(toChunks(original, TEST_CHUNK_SIZE));
            expect(fromChunks(chunks)).toEqual(original);
        });

        test('should throw when chunks array is empty', () => {
            expect(() => fromChunks([])).toThrow();
        });

        test('should throw when chunks are missing', () => {
            const original = createMockData();
            const chunks = Array.from(toChunks(original, TEST_CHUNK_SIZE));
            expect(() => fromChunks(chunks.slice(0, -1))).toThrow();
        });

        test('should throw when chunk streamIDs are inconsistent', () => {
            const original = createMockData();
            const chunks = Array.from(toChunks(original, TEST_CHUNK_SIZE));
            chunks[1].streamID = 'corrupted';
            expect(() => fromChunks(chunks)).toThrow();
        });

        test('should correctly process chunks that are out of order', () => {
            const original = createMockData();
            const chunks = Array.from(toChunks(original, TEST_CHUNK_SIZE)).sort(() => Math.random() - 0.5);
            expect(fromChunks(chunks)).toEqual(original);
        });
    });
});
