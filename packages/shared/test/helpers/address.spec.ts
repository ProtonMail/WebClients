import { ADDRESS_FLAGS } from '@proton/shared/lib/constants';
import { getIsBYOEOnlyAccount } from '@proton/shared/lib/helpers/address';
import type { Address } from '@proton/shared/lib/interfaces';

const BYOEAddress = {
    ID: 'byoe-address',
    Flags: ADDRESS_FLAGS.BYOE,
} as Address;

const internalAddress = {
    ID: 'internal-address',
} as Address;

describe('Address helpers', () => {
    describe('getIsBYOEOnlyAccount', () => {
        it('should not be a BYOE only account when no address', () => {
            expect(getIsBYOEOnlyAccount(undefined)).toBe(false);
            expect(getIsBYOEOnlyAccount([])).toBe(false);
        });

        it('should not be a BYOE only account when having internal addresses', () => {
            expect(getIsBYOEOnlyAccount([internalAddress, BYOEAddress])).toBe(false);
        });

        it('should be a BYOE only account when having only BYOE addresses', () => {
            expect(getIsBYOEOnlyAccount([BYOEAddress])).toBe(true);
        });
    });
});
