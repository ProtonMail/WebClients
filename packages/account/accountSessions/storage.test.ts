import { utf8StringToUint8Array } from '@protontech/crypto/utils';

import type { PersistedSession } from '@proton/shared/lib/authentication/SessionInterface';
import { SessionSource } from '@proton/shared/lib/authentication/SessionInterface';
import { AccessType } from '@proton/shared/lib/authentication/accessType';
import { SessionAccessTypeFlag, selfAccessTypeMask } from '@proton/shared/lib/authentication/sessionAccessType';

import { readAccountSessions, writeAccountSessions } from './storage';

/** jsdom won't accept a cookie for the second level domain, so the cookie is held here instead. */
const cookie: { value?: string } = {};

jest.mock('@proton/shared/lib/helpers/cookies', () => ({
    setCookie: ({ cookieValue }: { cookieValue: string }) => {
        cookie.value = cookieValue;
    },
    getCookie: () => cookie.value,
}));

const encode = (value: unknown) =>
    utf8StringToUint8Array(JSON.stringify(value)).toBase64({ alphabet: 'base64url', omitPadding: true });

const decode = (value: string) =>
    JSON.parse(new TextDecoder().decode(Uint8Array.fromBase64(value, { alphabet: 'base64url' })));

const getSession = (value: Partial<PersistedSession> & Pick<PersistedSession, 'localID'>) =>
    ({
        UserID: `user-${value.localID}`,
        UID: `uid-${value.localID}`,
        accessTypeMask: selfAccessTypeMask,
        source: SessionSource.Proton,
        persistent: true,
        trusted: false,
        payloadVersion: 1,
        payloadType: 'default',
        persistedAt: 0,
        ...value,
    }) as PersistedSession;

beforeEach(() => {
    delete cookie.value;
});

describe('readAccountSessions', () => {
    it('reads a bare local id', () => {
        cookie.value = encode([1, 3]);

        expect(readAccountSessions()).toEqual([{ localID: 1 }, { localID: 3 }]);
    });

    it.each([
        ['with an access type', { l: 2, a: AccessType.AdminAccess }],
        ['with the long-dead s', { l: 2, a: AccessType.AdminAccess, s: 0 }],
        ['with only s', { l: 2, s: 0 }],
    ])('reads the local id out of the shape %s, ignoring the rest', (_name, item) => {
        cookie.value = encode([item]);

        expect(readAccountSessions()).toEqual([{ localID: 2 }]);
    });

    it('skips items with no usable local id', () => {
        cookie.value = encode([{ l: 'not-a-number' }, null, 'nonsense', { a: 1 }, 4]);

        expect(readAccountSessions()).toEqual([{ localID: 4 }]);
    });

    it('returns undefined for a cookie it cannot parse at all', () => {
        cookie.value = 'nonsense';

        expect(readAccountSessions()).toBeUndefined();
    });

    it('returns undefined when every item is unusable, rather than an empty list', () => {
        cookie.value = encode([{ a: 1 }]);

        expect(readAccountSessions()).toBeUndefined();
    });

    it('returns undefined when there is no cookie', () => {
        expect(readAccountSessions()).toBeUndefined();
    });
});

describe('writeAccountSessions', () => {
    it('writes a bare local id for self access, and collapses the mask for anything else', () => {
        writeAccountSessions([
            getSession({ localID: 1 }),
            getSession({ localID: 2, accessTypeMask: SessionAccessTypeFlag.AdminAccess }),
            getSession({ localID: 3, accessTypeMask: SessionAccessTypeFlag.OrgAccess }),
            getSession({
                localID: 4,
                accessTypeMask: SessionAccessTypeFlag.AdminAccess | SessionAccessTypeFlag.DelegatedAccess,
            }),
        ]);

        // The access type is only here for clients that read it rather than the API response
        expect(decode(cookie.value!)).toEqual([
            1,
            { l: 2, a: AccessType.AdminAccess },
            { l: 3, a: AccessType.Msp },
            { l: 4, a: AccessType.AdminAccess },
        ]);
    });

    it('leaves out the sessions the switcher does not show', () => {
        writeAccountSessions([
            getSession({ localID: 1 }),
            getSession({ localID: 2, source: SessionSource.Oauth }),
            getSession({ localID: 3, source: SessionSource.Msp }),
            getSession({ localID: 4, source: SessionSource.Saml }),
        ]);

        expect(readAccountSessions()).toEqual([{ localID: 1 }, { localID: 4 }]);
    });

    it('round-trips through the cookie', () => {
        writeAccountSessions([
            getSession({ localID: 1 }),
            getSession({ localID: 2, accessTypeMask: SessionAccessTypeFlag.OrgAccess }),
        ]);

        expect(readAccountSessions()).toEqual([{ localID: 1 }, { localID: 2 }]);
    });
});
