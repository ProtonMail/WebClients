import { isFallbackAddress, isOwnAddress } from '../../../src/helpers/address';

const ADDRESS_CAN_RECEIVE = { Receive: 1 };
const ADDRESS_CANNOT_RECEIVE = { Receive: 0 };
const UNDEFINED_ADDRESS = undefined;
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

    it('should be a handle undefined address', () => {
        expect(isFallbackAddress(UNDEFINED_ADDRESS, KEYS)).toBeFalsy();
    });
});

describe('isOwnAddress', () => {
    it('should handle undefined address', () => {
        expect(isOwnAddress(UNDEFINED_ADDRESS, KEYS)).toBeFalsy();
    });

    it('should be an own address', () => {
        expect(isOwnAddress(ADDRESS_CAN_RECEIVE, KEYS)).toBeTruthy();
    });
});
