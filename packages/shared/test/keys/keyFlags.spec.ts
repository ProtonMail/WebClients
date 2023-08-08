import { ADDRESS_FLAGS, ADDRESS_TYPE, KEY_FLAG } from '@proton/shared/lib/constants';
import { hasBit } from '@proton/shared/lib/helpers/bitset';
import { Address } from '@proton/shared/lib/interfaces';

import { getDefaultKeyFlags } from '../../lib/keys/keyFlags';

describe('getDefaultKeyFlags', () => {
    it('default key flags should be not obsolete and not compromised', () => {
        const defaultFlags = getDefaultKeyFlags(undefined);
        expect(hasBit(defaultFlags, KEY_FLAG.FLAG_NOT_OBSOLETE)).toBe(true);
        expect(hasBit(defaultFlags, KEY_FLAG.FLAG_NOT_COMPROMISED)).toBe(true);
    });

    it('should set external flags for external address', () => {
        const defaultFlags = getDefaultKeyFlags({ Type: ADDRESS_TYPE.TYPE_EXTERNAL } as Address);
        expect(hasBit(defaultFlags, KEY_FLAG.FLAG_NOT_OBSOLETE)).toBe(true);
        expect(hasBit(defaultFlags, KEY_FLAG.FLAG_NOT_COMPROMISED)).toBe(true);
        expect(hasBit(defaultFlags, KEY_FLAG.FLAG_EMAIL_NO_ENCRYPT)).toBe(true);
    });

    it('should set email no encrypt flag for address with disable e2ee flag', () => {
        const defaultFlags = getDefaultKeyFlags({ Flags: ADDRESS_FLAGS.FLAG_DISABLE_E2EE } as Address);
        expect(hasBit(defaultFlags, KEY_FLAG.FLAG_NOT_OBSOLETE)).toBe(true);
        expect(hasBit(defaultFlags, KEY_FLAG.FLAG_NOT_COMPROMISED)).toBe(true);
        expect(hasBit(defaultFlags, KEY_FLAG.FLAG_EMAIL_NO_ENCRYPT)).toBe(true);
    });

    it('should set email no sign flag for address with disable expected signed flag', () => {
        const defaultFlags = getDefaultKeyFlags({ Flags: ADDRESS_FLAGS.FLAG_DISABLE_EXPECTED_SIGNED } as Address);
        expect(hasBit(defaultFlags, KEY_FLAG.FLAG_NOT_OBSOLETE)).toBe(true);
        expect(hasBit(defaultFlags, KEY_FLAG.FLAG_NOT_COMPROMISED)).toBe(true);
        expect(hasBit(defaultFlags, KEY_FLAG.FLAG_EMAIL_NO_SIGN)).toBe(true);
    });
});
