import { describe, it } from 'mocha';
import assert from 'assert';

import { clearBit, hasBit, setBit, toggleBit } from '../../lib/helpers/bitset';

describe('bitset', () => {
    describe('setBit', () => {
        it('should handle empty parameter', () => {
            assert.strictEqual(setBit(), 0);
            assert.strictEqual(setBit({}, 0b1), 0b1);
        });

        it('should add a new flag', () => {
            assert.strictEqual(setBit(0b01, 0b10), 0b11);
        });

        it('should add a new flag if possible', () => {
            assert.strictEqual(setBit(0b1, 0b1), 0b1);
        });
    });

    describe('hasBit', () => {
        it('should handle empty parameter', () => {
            assert.strictEqual(hasBit(), false);
            assert.strictEqual(hasBit({}, 0b1), false);
        });

        it('should handle first bit', () => {
            assert.strictEqual(hasBit(0b1, 0b1), true);
            assert.strictEqual(hasBit(0b0, 0b1), false);
        });

        it('should handle multiple bits', () => {
            assert.strictEqual(hasBit(0b11, 0b10), true);
            assert.strictEqual(hasBit(0b11, 0b01), true);
            assert.strictEqual(hasBit(0b01, 0b10), false);
            assert.strictEqual(hasBit(0b11, 0b11), true);
        });
    });

    describe('toggleBit', () => {
        it('should handle empty parameter', () => {
            assert.strictEqual(toggleBit(), 0);
            assert.strictEqual(toggleBit({}, 0b1), 0b1);
        });

        it('should toggle a flag', () => {
            assert.strictEqual(toggleBit(0b1, 0b1), 0b0);
        });

        it('should remove a flag', () => {
            assert.strictEqual(toggleBit(0b10, 0b10), 0b00);
        });

        it('should remove a flag and keep the other', () => {
            assert.strictEqual(toggleBit(0b11, 0b10), 0b01);
        });

        it('should add a new flag if possible', () => {
            assert.strictEqual(toggleBit(0b10, 0b01), 0b11);
        });
    });

    describe('clearBit', () => {
        it('should handle empty parameter', () => {
            assert.strictEqual(clearBit(), 0);
        });

        it('should remove the flag', () => {
            assert.strictEqual(clearBit(0b11, 0b10), 0b01);
        });

        it('should remove the flag only if it exists', () => {
            assert.strictEqual(clearBit(0b1, 0b1), 0);
            assert.strictEqual(clearBit(0b1, 0b10), 0b1);
        });
    });
});
