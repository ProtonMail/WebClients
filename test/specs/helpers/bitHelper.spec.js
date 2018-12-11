import { clearBit, hasBit, setBit, toggleBit } from '../../../src/helpers/bitHelper';

describe('setBit', () => {
    it('should handle empty parameter', () => {
        expect(setBit()).toBe(0);
        expect(setBit({}, 0b1)).toBe(0b1);
    });

    it('should add a new flag', () => {
        expect(setBit(0b01, 0b10)).toBe(0b11);
    });

    it('should add a new flag if possible', () => {
        expect(setBit(0b1, 0b1)).toBe(0b1);
    });
});

describe('hasBit', () => {
    it('should handle empty parameter', () => {
        expect(hasBit()).toBe(false);
        expect(hasBit({}, 0b1)).toBe(false);
    });

    it('should handle first bit', () => {
        expect(hasBit(0b1, 0b1)).toBe(true);
        expect(hasBit(0b0, 0b1)).toBe(false);
    });

    it('should handle multiple bits', () => {
        expect(hasBit(0b11, 0b10)).toBe(true);
        expect(hasBit(0b11, 0b01)).toBe(true);
        expect(hasBit(0b01, 0b10)).toBe(false);
        expect(hasBit(0b11, 0b11)).toBe(true);
    });
});

describe('toggleBit', () => {
    it('should handle empty parameter', () => {
        expect(toggleBit()).toBe(0);
        expect(toggleBit({}, 0b1)).toBe(0b1);
    });

    it('should toggle a flag', () => {
        expect(toggleBit(0b1, 0b1)).toBe(0b0);
    });

    it('should remove a flag', () => {
        expect(toggleBit(0b10, 0b10)).toBe(0b00);
    });

    it('should remove a flag and keep the other', () => {
        expect(toggleBit(0b11, 0b10)).toBe(0b01);
    });

    it('should add a new flag if possible', () => {
        expect(toggleBit(0b10, 0b01)).toBe(0b11);
    });
});

describe('clearBit', () => {
    it('should handle empty parameter', () => {
        expect(clearBit()).toBe(0);
    });

    it('should remove the flag', () => {
        expect(clearBit(0b11, 0b10)).toBe(0b01);
    });

    it('should remove the flag only if it exists', () => {
        expect(clearBit(0b1, 0b1)).toBe(0);
        expect(clearBit(0b1, 0b10)).toBe(0b1);
    });
});
