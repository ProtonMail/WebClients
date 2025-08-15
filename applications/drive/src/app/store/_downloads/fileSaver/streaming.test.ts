import { LRUMap, type VideoStream, getBlockIndices, getChunkFromBlocksData, parseRange } from './streaming';

const arrayEquals = (a: Uint8Array<ArrayBuffer>, b: Uint8Array<ArrayBuffer>): boolean => {
    if (a.length !== b.length) {
        return false;
    }
    for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) {
            return false;
        }
    }
    return true;
};

describe('getChunkFromBlocksData', () => {
    test('should extract chunk from single block', () => {
        const blocks = [new Uint8Array([1, 2, 3, 4, 5])];
        const indices = [0];
        const blockSizes = [5];
        const range = { start: 1, end: 3 };

        const result = getChunkFromBlocksData(range, blocks, indices, blockSizes);
        const expected = new Uint8Array([2, 3, 4]);

        expect(arrayEquals(result, expected)).toBe(true);
    });

    test('should extract chunk from multiple blocks', () => {
        const blocks = [new Uint8Array([1, 2, 3]), new Uint8Array([4, 5, 6]), new Uint8Array([7, 8, 9])];
        const indices = [0];
        const blockSizes = [3, 3, 3];
        const range = { start: 2, end: 6 };

        const result = getChunkFromBlocksData(range, blocks, indices, blockSizes);
        const expected = new Uint8Array([3, 4, 5, 6, 7]);

        expect(arrayEquals(result, expected)).toBe(true);
    });

    test('should handle offset calculation with non-zero first index', () => {
        const blocks = [new Uint8Array([10, 11, 12])];
        const indices = [2];
        const blockSizes = [5, 3, 3];
        const range = { start: 9, end: 11 };

        const result = getChunkFromBlocksData(range, blocks, indices, blockSizes);
        const expected = new Uint8Array([11, 12]);
        expect(result.length).toBe(2);
        expect(arrayEquals(result, expected)).toBe(true);
    });

    test('should handle single byte extraction', () => {
        const blocks = [new Uint8Array([100, 200, 300])];
        const indices = [0];
        const blockSizes = [3];
        const range = { start: 1, end: 1 };

        const result = getChunkFromBlocksData(range, blocks, indices, blockSizes);
        const expected = new Uint8Array([200]);

        expect(arrayEquals(result, expected)).toBe(true);
    });

    test('should handle edge case - extract from beginning', () => {
        const blocks = [new Uint8Array([10, 20, 30, 40])];
        const indices = [0];
        const blockSizes = [4];
        const range = { start: 0, end: 1 };

        const result = getChunkFromBlocksData(range, blocks, indices, blockSizes);
        const expected = new Uint8Array([10, 20]);

        expect(arrayEquals(result, expected)).toBe(true);
    });

    test('should handle edge case - extract to end', () => {
        const blocks = [new Uint8Array([10, 20, 30, 40])];
        const indices = [0];
        const blockSizes = [4];
        const range = { start: 2, end: 3 };

        const result = getChunkFromBlocksData(range, blocks, indices, blockSizes);
        const expected = new Uint8Array([30, 40]);

        expect(arrayEquals(result, expected)).toBe(true);
    });

    test('should handle blocks of different sizes', () => {
        const blocks = [
            new Uint8Array([1, 2]), // 2 bytes
            new Uint8Array([3, 4, 5, 6]), // 4 bytes
            new Uint8Array([7]), // 1 byte
        ];
        const indices = [0];
        const blockSizes = [2, 4, 1];
        const range = { start: 1, end: 4 };

        const result = getChunkFromBlocksData(range, blocks, indices, blockSizes);
        const expected = new Uint8Array([2, 3, 4, 5]);

        expect(arrayEquals(result, expected)).toBe(true);
    });

    test('should handle out of bounds range gracefully', () => {
        const blocks = [new Uint8Array([1, 2, 3])];
        const indices = [0];
        const blockSizes = [3];
        const range = { start: 5, end: 10 }; // Beyond available data

        expect(() => {
            getChunkFromBlocksData(range, blocks, indices, blockSizes);
        }).not.toThrow();
    });

    test('should handle negative start position after offset calculation', () => {
        const blocks = [new Uint8Array([1, 2, 3])];
        const indices = [2]; // Skip 2 blocks
        const blockSizes = [10, 5, 3]; // Total offset would be 15
        const range = { start: 5, end: 7 }; // This would result in negative sliceStart

        expect(() => {
            getChunkFromBlocksData(range, blocks, indices, blockSizes);
        }).not.toThrow();
    });
});

describe('getChunkFromBlocksData - Integration scenarios', () => {
    test('realistic file chunking scenario', () => {
        // Simulate reading chunks from a file that's split across multiple blocks
        const blocks = [
            new Uint8Array([65, 66, 67, 68]), // "ABCD"
            new Uint8Array([69, 70, 71]), // "EFG"
            new Uint8Array([72, 73, 74, 75]), // "HIJL"
        ];
        const indices = [1]; // Start from second block
        const blockSizes = [100, 4, 3, 4]; // Assume first block was 100 bytes
        const range = { start: 102, end: 105 }; // Want bytes 102-105 (should be "CDEF")

        const result = getChunkFromBlocksData(range, blocks, indices, blockSizes);

        // With firstOffset = 100, sliceStart = 102 - 100 = 2
        // From concatenated [A,B,C,D,E,F,G,H,I,J,L], positions 2-5 = [C,D,E,F]
        const expected = new Uint8Array([67, 68, 69, 70]); // "CDEF"
        expect(arrayEquals(result, expected)).toBe(true);
    });
});

describe('parseRange', () => {
    const mockVideoStream: VideoStream = {
        blockSizes: [1024, 2048, 4096],
        totalSize: 10000,
        mimeType: 'video/mp4',
        cache: new LRUMap<number, Uint8Array<ArrayBuffer>>(3),
    };

    describe('valid range headers', () => {
        it('should parse closed range (start-end)', () => {
            const result = parseRange('bytes=0-1023', mockVideoStream);
            expect(result).toEqual({ start: 0, end: 1023 });
        });

        it('should parse another closed range', () => {
            const result = parseRange('bytes=1024-2047', mockVideoStream);
            expect(result).toEqual({ start: 1024, end: 2047 });
        });

        it('should clamp end to totalSize - 1 when requested end exceeds file size', () => {
            const result = parseRange('bytes=0-50000', mockVideoStream);
            expect(result).toEqual({ start: 0, end: 9999 }); // totalSize - 1
        });

        it('should parse open-ended range using first block size', () => {
            const result = parseRange('bytes=0-', mockVideoStream);
            // start (0) + firstBlock (1024) - 1 = 1023
            expect(result).toEqual({ start: 0, end: 1023 });
        });

        it('should parse open-ended range from middle position', () => {
            const result = parseRange('bytes=5000-', mockVideoStream);
            // start (5000) + firstBlock (1024) - 1 = 6023
            expect(result).toEqual({ start: 5000, end: 6023 });
        });

        it('should clamp open-ended range to file end when block would exceed totalSize', () => {
            const result = parseRange('bytes=9500-', mockVideoStream);
            // start (9500) + firstBlock (1024) - 1 = 10523, but clamped to 9999
            expect(result).toEqual({ start: 9500, end: 9999 });
        });
    });

    describe('edge cases with block sizes', () => {
        it('should handle empty blockSizes array', () => {
            const streamWithEmptyBlocks: VideoStream = {
                blockSizes: [],
                totalSize: 5000,
                mimeType: 'video/mp4',
                cache: new LRUMap<number, Uint8Array<ArrayBuffer>>(3),
            };

            const result = parseRange('bytes=1000-', streamWithEmptyBlocks);
            // Should use totalSize when no block sizes available
            expect(result).toEqual({ start: 1000, end: 4999 }); // totalSize - 1
        });

        it('should handle single block size', () => {
            const streamWithSingleBlock: VideoStream = {
                blockSizes: [512],
                totalSize: 2000,
                mimeType: 'video/mp4',
                cache: new LRUMap<number, Uint8Array<ArrayBuffer>>(3),
            };

            const result = parseRange('bytes=100-', streamWithSingleBlock);
            expect(result).toEqual({ start: 100, end: 611 }); // 100 + 512 - 1
        });

        it('should handle very large block size', () => {
            const streamWithLargeBlock: VideoStream = {
                blockSizes: [50000],
                totalSize: 10000,
                mimeType: 'video/mp4',
                cache: new LRUMap<number, Uint8Array<ArrayBuffer>>(3),
            };

            const result = parseRange('bytes=0-', streamWithLargeBlock);
            // Block size exceeds total, should clamp to totalSize - 1
            expect(result).toEqual({ start: 0, end: 9999 });
        });
    });

    describe('boundary conditions', () => {
        it('should handle range starting at file end', () => {
            const result = parseRange('bytes=9999-', mockVideoStream);
            expect(result).toEqual({ start: 9999, end: 9999 });
        });

        it('should handle range at exact file boundaries', () => {
            const result = parseRange('bytes=0-9999', mockVideoStream);
            expect(result).toEqual({ start: 0, end: 9999 });
        });

        it('should handle single byte range', () => {
            const result = parseRange('bytes=500-500', mockVideoStream);
            expect(result).toEqual({ start: 500, end: 500 });
        });
    });

    describe('invalid range headers', () => {
        it('should return null for malformed header without bytes prefix', () => {
            const result = parseRange('0-1023', mockVideoStream);
            expect(result).toBeNull();
        });

        it('should return null for header without range values', () => {
            const result = parseRange('bytes=', mockVideoStream);
            expect(result).toBeNull();
        });

        it('should return null for header with invalid format', () => {
            const result = parseRange('bytes=abc-def', mockVideoStream);
            expect(result).toBeNull();
        });

        it('should return null for completely invalid header', () => {
            const result = parseRange('invalid-header', mockVideoStream);
            expect(result).toBeNull();
        });

        it('should return null for empty string', () => {
            const result = parseRange('', mockVideoStream);
            expect(result).toBeNull();
        });

        it('should return null for header with missing start value', () => {
            const result = parseRange('bytes=-1023', mockVideoStream);
            expect(result).toBeNull();
        });
    });

    describe('numeric edge cases', () => {
        it('should handle zero start position', () => {
            const result = parseRange('bytes=0-0', mockVideoStream);
            expect(result).toEqual({ start: 0, end: 0 });
        });

        it('should handle large numbers', () => {
            const largeVideoStream: VideoStream = {
                blockSizes: [1024],
                totalSize: 999999999,
                mimeType: 'video/mp4',
                cache: new LRUMap<number, Uint8Array<ArrayBuffer>>(3),
            };

            const result = parseRange('bytes=999999998-', largeVideoStream);
            expect(result).toEqual({ start: 999999998, end: 999999998 });
        });

        it('should properly parse multi-digit numbers', () => {
            const result = parseRange('bytes=123456-789012', mockVideoStream);
            expect(result).toEqual({ start: 123456, end: 9999 }); // clamped to totalSize - 1
        });
    });

    describe('different video stream configurations', () => {
        it('should work with different mime types', () => {
            const webmStream: VideoStream = {
                blockSizes: [2048],
                totalSize: 8000,
                mimeType: 'video/webm',
                cache: new LRUMap<number, Uint8Array<ArrayBuffer>>(3),
            };

            const result = parseRange('bytes=1000-', webmStream);
            expect(result).toEqual({ start: 1000, end: 3047 }); // 1000 + 2048 - 1
        });

        it('should handle small file with large block size', () => {
            const smallStream: VideoStream = {
                blockSizes: [10000],
                totalSize: 100,
                mimeType: 'video/mp4',
                cache: new LRUMap<number, Uint8Array<ArrayBuffer>>(3),
            };

            const result = parseRange('bytes=50-', smallStream);
            expect(result).toEqual({ start: 50, end: 99 }); // clamped to totalSize - 1
        });
    });
});

describe('getBlockIndices', () => {
    const mockVideoStream: VideoStream = {
        blockSizes: [1000, 2000, 1500, 3000, 500],
        totalSize: 8000,
        mimeType: 'video/mp4',
        cache: new LRUMap<number, Uint8Array<ArrayBuffer>>(3),
    };
    // Block layout:
    // Block 0: bytes 0-999 (size 1000)
    // Block 1: bytes 1000-2999 (size 2000)
    // Block 2: bytes 3000-4499 (size 1500)
    // Block 3: bytes 4500-7499 (size 3000)
    // Block 4: bytes 7500-7999 (size 500)

    describe('single block ranges', () => {
        it('should return first block for range within first block', () => {
            const result = getBlockIndices(0, 500, mockVideoStream);
            expect(result).toEqual([0]);
        });

        it('should return second block for range within second block', () => {
            const result = getBlockIndices(1500, 2500, mockVideoStream);
            expect(result).toEqual([1]);
        });

        it('should return last block for range within last block', () => {
            const result = getBlockIndices(7600, 7800, mockVideoStream);
            expect(result).toEqual([4]);
        });

        it('should return correct block for range exactly matching block boundaries', () => {
            const result = getBlockIndices(3000, 4499, mockVideoStream);
            expect(result).toEqual([2]);
        });
    });

    describe('multiple block ranges', () => {
        it('should return multiple blocks for range spanning two blocks', () => {
            const result = getBlockIndices(500, 1500, mockVideoStream);
            expect(result).toEqual([0, 1]);
        });

        it('should return three consecutive blocks', () => {
            const result = getBlockIndices(2500, 5000, mockVideoStream);
            expect(result).toEqual([1, 2, 3]);
        });

        it('should return all blocks when range spans entire file', () => {
            const result = getBlockIndices(0, 7999, mockVideoStream);
            expect(result).toEqual([0, 1, 2, 3, 4]);
        });

        it('should return first three blocks', () => {
            const result = getBlockIndices(0, 3500, mockVideoStream);
            expect(result).toEqual([0, 1, 2]);
        });

        it('should return last two blocks', () => {
            const result = getBlockIndices(6000, 7999, mockVideoStream);
            expect(result).toEqual([3, 4]);
        });
    });

    describe('boundary conditions', () => {
        it('should handle range starting at block boundary', () => {
            const result = getBlockIndices(1000, 1500, mockVideoStream);
            expect(result).toEqual([1]);
        });

        it('should handle range ending at block boundary', () => {
            const result = getBlockIndices(500, 999, mockVideoStream);
            expect(result).toEqual([0]);
        });

        it('should handle range spanning exact block boundaries', () => {
            const result = getBlockIndices(999, 1000, mockVideoStream);
            expect(result).toEqual([0, 1]);
        });

        it('should handle single byte at block boundary', () => {
            const result = getBlockIndices(2999, 2999, mockVideoStream);
            expect(result).toEqual([1]);
        });

        it('should handle single byte at start of block', () => {
            const result = getBlockIndices(3000, 3000, mockVideoStream);
            expect(result).toEqual([2]);
        });
    });

    describe('edge cases', () => {
        it('should return empty array when start is after all blocks', () => {
            const result = getBlockIndices(10000, 12000, mockVideoStream);
            expect(result).toEqual([]);
        });

        it('should return empty array when end is before all blocks', () => {
            const result = getBlockIndices(-1000, -500, mockVideoStream);
            expect(result).toEqual([]);
        });

        it('should handle range where start > end (invalid range)', () => {
            const result = getBlockIndices(5000, 2000, mockVideoStream);
            expect(result).toEqual([]);
        });

        it('should handle zero-length range', () => {
            const result = getBlockIndices(1500, 1500, mockVideoStream);
            expect(result).toEqual([1]);
        });
    });

    describe('different block size configurations', () => {
        it('should work with single block', () => {
            const singleBlockStream: VideoStream = {
                blockSizes: [5000],
                totalSize: 5000,
                mimeType: 'video/mp4',
                cache: new LRUMap<number, Uint8Array<ArrayBuffer>>(3),
            };

            const result = getBlockIndices(1000, 3000, singleBlockStream);
            expect(result).toEqual([0]);
        });

        it('should work with uniform block sizes', () => {
            const uniformStream: VideoStream = {
                blockSizes: [1000, 1000, 1000, 1000],
                totalSize: 4000,
                mimeType: 'video/mp4',
                cache: new LRUMap<number, Uint8Array<ArrayBuffer>>(3),
            };
            // Block 0: 0-999, Block 1: 1000-1999, Block 2: 2000-2999, Block 3: 3000-3999

            const result = getBlockIndices(1500, 2500, uniformStream);
            expect(result).toEqual([1, 2]);
        });

        it('should work with very small blocks', () => {
            const smallBlockStream: VideoStream = {
                blockSizes: [10, 20, 30, 40],
                totalSize: 100,
                mimeType: 'video/mp4',
                cache: new LRUMap<number, Uint8Array<ArrayBuffer>>(3),
            };
            // Block 0: 0-9, Block 1: 10-29, Block 2: 30-59, Block 3: 60-99

            const result = getBlockIndices(5, 35, smallBlockStream);
            expect(result).toEqual([0, 1, 2]);
        });

        it('should work with empty block sizes array', () => {
            const emptyBlockStream: VideoStream = {
                blockSizes: [],
                totalSize: 1000,
                mimeType: 'video/mp4',
                cache: new LRUMap<number, Uint8Array<ArrayBuffer>>(3),
            };

            const result = getBlockIndices(0, 500, emptyBlockStream);
            expect(result).toEqual([]);
        });

        it('should work with blocks of varying sizes', () => {
            const varyingStream: VideoStream = {
                blockSizes: [100, 5000, 50, 2000],
                totalSize: 7150,
                mimeType: 'video/mp4',
                cache: new LRUMap<number, Uint8Array<ArrayBuffer>>(3),
            };
            // Block 0: 0-99, Block 1: 100-5099, Block 2: 5100-5149, Block 3: 5150-7149

            const result = getBlockIndices(50, 5120, varyingStream);
            expect(result).toEqual([0, 1, 2]);
        });
    });

    describe('overlapping scenarios', () => {
        it('should handle range that touches block start and end', () => {
            const result = getBlockIndices(999, 1000, mockVideoStream);
            expect(result).toEqual([0, 1]);
        });

        it('should handle range that barely overlaps with block', () => {
            const result = getBlockIndices(4499, 4500, mockVideoStream);
            expect(result).toEqual([2, 3]);
        });

        it('should handle very large range extending beyond file', () => {
            const result = getBlockIndices(0, 50000, mockVideoStream);
            expect(result).toEqual([0, 1, 2, 3, 4]);
        });
    });

    describe('performance and correctness verification', () => {
        it('should maintain correct block index order', () => {
            const result = getBlockIndices(500, 6000, mockVideoStream);
            expect(result).toEqual([0, 1, 2, 3]);

            // Verify indices are in ascending order
            for (let i = 1; i < result.length; i++) {
                expect(result[i]).toBeGreaterThan(result[i - 1]);
            }
        });

        it('should not include duplicate indices', () => {
            const result = getBlockIndices(2000, 5000, mockVideoStream);
            const uniqueResult = [...new Set(result)];
            expect(result).toEqual(uniqueResult);
        });

        it('should work with complex overlapping range', () => {
            // This range spans from middle of block 1 to middle of block 3
            const result = getBlockIndices(2000, 6000, mockVideoStream);
            expect(result).toEqual([1, 2, 3]);
        });
    });
});

describe('LRUMap', () => {
    describe('constructor', () => {
        it('should create an empty LRUMap with specified max size', () => {
            const lru = new LRUMap<string, number>(3);
            expect(lru.size).toBe(0);
            expect(lru).toBeInstanceOf(Map);
        });

        it('should handle max size of 1', () => {
            const lru = new LRUMap<string, number>(1);
            expect(lru.size).toBe(0);
        });

        it('should handle max size of 0', () => {
            const lru = new LRUMap<string, number>(0);
            expect(lru.size).toBe(0);
        });
    });

    describe('set method', () => {
        it('should add new entries when under capacity', () => {
            const lru = new LRUMap<string, number>(3);

            lru.set('a', 1);
            expect(lru.size).toBe(1);
            expect(lru.get('a')).toBe(1);

            lru.set('b', 2);
            expect(lru.size).toBe(2);
            expect(lru.get('b')).toBe(2);
        });

        it('should update existing key and move it to end', () => {
            const lru = new LRUMap<string, number>(3);
            lru.set('a', 1);
            lru.set('b', 2);
            lru.set('c', 3);

            // Update existing key
            lru.set('a', 10);

            expect(lru.size).toBe(3);
            expect(lru.get('a')).toBe(10);

            // Verify 'a' is now most recently used by checking order
            const keys = Array.from(lru.keys());
            expect(keys).toEqual(['b', 'c', 'a']);
        });

        it('should evict least recently used item when at capacity', () => {
            const lru = new LRUMap<string, number>(2);
            lru.set('a', 1);
            lru.set('b', 2);

            // This should evict 'a'
            lru.set('c', 3);

            expect(lru.size).toBe(2);
            expect(lru.has('a')).toBe(false);
            expect(lru.get('b')).toBe(2);
            expect(lru.get('c')).toBe(3);
        });

        it('should maintain insertion order for LRU behavior', () => {
            const lru = new LRUMap<string, number>(3);
            lru.set('first', 1);
            lru.set('second', 2);
            lru.set('third', 3);

            // Add fourth item, should evict 'first'
            lru.set('fourth', 4);

            expect(lru.has('first')).toBe(false);
            expect(lru.has('second')).toBe(true);
            expect(lru.has('third')).toBe(true);
            expect(lru.has('fourth')).toBe(true);

            const keys = Array.from(lru.keys());
            expect(keys).toEqual(['second', 'third', 'fourth']);
        });

        it('should return this for method chaining', () => {
            const lru = new LRUMap<string, number>(3);
            const result = lru.set('a', 1);
            expect(result).toBe(lru);
        });

        it('should handle capacity of 1 correctly', () => {
            const lru = new LRUMap<string, number>(1);
            lru.set('a', 1);
            expect(lru.get('a')).toBe(1);

            lru.set('b', 2);
            expect(lru.has('a')).toBe(false);
            expect(lru.get('b')).toBe(2);
            expect(lru.size).toBe(1);
        });
    });

    describe('LRU behavior scenarios', () => {
        it('should correctly implement LRU eviction with mixed operations', () => {
            const lru = new LRUMap<string, number>(3);

            // Fill to capacity
            lru.set('a', 1);
            lru.set('b', 2);
            lru.set('c', 3);

            // Set 'a' to make it most recently used
            lru.set('a', 1);

            // Add new item, should evict 'b' (least recently used)
            lru.set('d', 4);

            expect(lru.has('b')).toBe(false);
            expect(lru.has('a')).toBe(true);
            expect(lru.has('c')).toBe(true);
            expect(lru.has('d')).toBe(true);
        });

        it('should handle repeated updates to same key', () => {
            const lru = new LRUMap<string, number>(2);
            lru.set('a', 1);
            lru.set('b', 2);

            // Repeatedly update 'a'
            lru.set('a', 10);
            lru.set('a', 100);

            expect(lru.size).toBe(2);
            expect(lru.get('a')).toBe(100);

            // 'a' should be most recent, so adding 'c' should evict 'b'
            lru.set('c', 3);
            expect(lru.has('b')).toBe(false);
            expect(lru.has('a')).toBe(true);
            expect(lru.has('c')).toBe(true);
        });
    });

    describe('integration with Map methods', () => {
        it('should work with inherited Map methods', () => {
            const lru = new LRUMap<string, number>(3);
            lru.set('a', 1);
            lru.set('b', 2);

            expect(lru.has('a')).toBe(true);
            expect(lru.has('c')).toBe(false);
            expect(lru.get('a')).toBe(1);
            expect(lru.get('nonexistent')).toBeUndefined();

            lru.delete('a');
            expect(lru.has('a')).toBe(false);
            expect(lru.size).toBe(1);

            lru.clear();
            expect(lru.size).toBe(0);
        });

        it('should support iteration', () => {
            const lru = new LRUMap<string, number>(3);
            lru.set('a', 1);
            lru.set('b', 2);
            lru.set('c', 3);

            const entries = Array.from(lru.entries());
            expect(entries).toEqual([
                ['a', 1],
                ['b', 2],
                ['c', 3],
            ]);

            const keys = Array.from(lru.keys());
            expect(keys).toEqual(['a', 'b', 'c']);

            const values = Array.from(lru.values());
            expect(values).toEqual([1, 2, 3]);
        });
    });

    describe('edge cases', () => {
        it('should handle undefined and null keys/values', () => {
            const lru = new LRUMap<any, any>(2);

            lru.set(null, 'null-value');
            lru.set(undefined, 'undefined-value');

            expect(lru.get(null)).toBe('null-value');
            expect(lru.get(undefined)).toBe('undefined-value');

            lru.set('key', null);
            lru.set('key2', undefined);

            expect(lru.get('key')).toBeNull();
            expect(lru.get('key2')).toBeUndefined();
        });

        it('should handle object keys', () => {
            const lru = new LRUMap<object, string>(2);
            const key1 = { id: 1 };
            const key2 = { id: 2 };

            lru.set(key1, 'value1');
            lru.set(key2, 'value2');

            expect(lru.get(key1)).toBe('value1');
            expect(lru.get(key2)).toBe('value2');
        });

        it('should handle very large capacity', () => {
            const lru = new LRUMap<number, string>(1000000);

            for (let i = 0; i < 1000; i++) {
                lru.set(i, `value${i}`);
            }

            expect(lru.size).toBe(1000);
            expect(lru.get(0)).toBe('value0');
            expect(lru.get(999)).toBe('value999');
        });
    });
});
