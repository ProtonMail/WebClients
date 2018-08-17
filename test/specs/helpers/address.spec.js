import { isFallbackAddress, isOwnAddress } from '../../../src/helpers/address';

const ADDRESS_CAN_RECEIVE = { Receive: 1 };
const ADDRESS_CANNOT_RECEIVE = { Receive: 0 };
const EMPTY_KEYS = [];
const KEYS = ['key'];

describe('isFallbackAddress', () => {
    it('should not be a fallback address', () => {
        expect(isFallbackAddress(ADDRESS_CAN_RECEIVE, KEYS)).toBeFalsy();
    });

    it('should not be a fallback address', () => {
        expect(isFallbackAddress(ADDRESS_CANNOT_RECEIVE, EMPTY_KEYS)).toBeFalsy();
    });

    it('should be a fallback address', () => {
        expect(isFallbackAddress(ADDRESS_CANNOT_RECEIVE, KEYS)).toBeTruthy();
    });
});

describe('isOwnAddress', () => {
    it('should handle undefined address', () => {
        expect(isOwnAddress(undefined, KEYS)).toBeFalsy();
    });

    it('should be an own address', () => {
        expect(isOwnAddress(ADDRESS_CAN_RECEIVE, KEYS)).toBeTruthy();
    });
});
