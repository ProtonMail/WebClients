import { utf8StringToUint8Array } from '@protontech/crypto/utils';

import { AccessType } from '../../lib/authentication/accessType';
import type { SignoutActionOptions, SignoutUserData } from '../../lib/authentication/logoutInterface';
import { getStandaloneLogoutURL, parseLogoutURL } from '../../lib/authentication/logoutUrl';

const getOptions = (users: SignoutUserData[]): SignoutActionOptions => ({
    type: 'all',
    reason: 'signout',
    clearDeviceRecovery: false,
    sessions: [],
    users,
});

const getSerialized = (users: SignoutUserData[]) => {
    const url = new URL(getStandaloneLogoutURL({ options: getOptions(users) }));
    const sessions = new URLSearchParams(url.hash.slice(1)).get('sessions');
    return JSON.parse(new TextDecoder().decode(Uint8Array.fromBase64(sessions!, { alphabet: 'base64url' })));
};

const parseSerialized = (sessions: object[]) => {
    const encoded = utf8StringToUint8Array(JSON.stringify(sessions)).toBase64({
        alphabet: 'base64url',
        omitPadding: true,
    });
    return parseLogoutURL(new URL(`https://account.proton.me/switch?reason=signout#sessions=${encoded}`)).sessions;
};

describe('serializing a signout', () => {
    it('sends the local id and nothing else that identifies the session', () => {
        expect(getSerialized([{ id: 'user-1', localID: 4 }])).toEqual([{ l: 4, id: 'user-1' }]);
    });

    it('does not send an access type, which would read as self access to a client using it', () => {
        expect(getSerialized([{ id: 'user-1', localID: 4 }])[0]).not.toHaveProperty('a');
    });

    it('round-trips the local id', () => {
        expect(parseSerialized(getSerialized([{ id: 'user-1', localID: 4 }]))).toEqual([{ id: 'user-1', localID: 4 }]);
    });
});

describe('parsing a signout from a client that predates the local id', () => {
    it.each([AccessType.Self, AccessType.AdminAccess, AccessType.EmergencyAccess, AccessType.Msp])(
        'reads the access type %i as sent, without widening it to a mask',
        (a) => {
            expect(parseSerialized([{ id: 'user-1', a }])).toEqual([{ id: 'user-1', accessType: a }]);
        }
    );

    it.each([
        [true, AccessType.Self],
        [false, AccessType.AdminAccess],
    ])('reads the pre-accessType shape with s=%s', (s, accessType) => {
        expect(parseSerialized([{ id: 'user-1', s, a: 0 }])).toEqual([{ id: 'user-1', accessType }]);
    });

    it('prefers a local id over an access type sent with it', () => {
        expect(parseSerialized([{ id: 'user-1', a: AccessType.Msp, l: 4 }])).toEqual([{ id: 'user-1', localID: 4 }]);
    });

    it('falls back to self access for an unrecognised value', () => {
        expect(parseSerialized([{ id: 'user-1', a: 99 }])).toEqual([{ id: 'user-1', accessType: AccessType.Self }]);
    });

    it('ignores a local id that is not a number', () => {
        expect(parseSerialized([{ id: 'user-1', a: AccessType.AdminAccess, l: 'nonsense' }])).toEqual([
            { id: 'user-1', accessType: AccessType.AdminAccess },
        ]);
    });
});
