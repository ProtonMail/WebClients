import { UserType } from '@proton/shared/lib/interfaces/User';
import {
    LOGIN_IDENTIFIER_POLICY,
    RESTRICTED_LOGIN_IDENTIFIER_POLICY,
} from '@proton/shared/lib/interfaces/UserSettings';

import { buildAddress } from '../testing/buildAddress';
import { buildUser } from '../testing/buildUser';
import { getCanShowSignInRestriction, getIsSignInRestricted, getSignInIdentifiers } from './helpers';

describe('getSignInIdentifiers', () => {
    it('uses the first enabled address, like the API', () => {
        const user = buildUser({ Name: 'eric.norbert' });
        const addresses = [
            buildAddress({ Email: 'disabled@proton.me', Status: 0 }),
            buildAddress({ Email: 'eric.norbert@example.com', Status: 1, Receive: 0, Send: 0 }),
            buildAddress({ Email: 'eric.norbert@proton.me', Status: 1, Receive: 1, Send: 1 }),
        ];

        expect(getSignInIdentifiers(user, addresses)).toEqual({
            username: 'eric.norbert',
            primaryEmail: 'eric.norbert@example.com',
        });
    });

    it('has no primary email when no address is enabled', () => {
        const user = buildUser({ Name: 'eric.norbert' });
        const addresses = [buildAddress({ Email: 'disabled@proton.me', Status: 0 })];

        expect(getSignInIdentifiers(user, addresses).primaryEmail).toBeUndefined();
    });
});

describe('getIsSignInRestricted', () => {
    it('is false when the policy includes all identifiers', () => {
        expect(getIsSignInRestricted(LOGIN_IDENTIFIER_POLICY.ALL)).toBe(false);
        expect(getIsSignInRestricted(LOGIN_IDENTIFIER_POLICY.ALL | LOGIN_IDENTIFIER_POLICY.USERNAME)).toBe(false);
    });

    it('is false for an empty mask, which the API treats as all identifiers', () => {
        expect(getIsSignInRestricted(0)).toBe(false);
    });

    it('is true for the username and primary address policy', () => {
        expect(getIsSignInRestricted(RESTRICTED_LOGIN_IDENTIFIER_POLICY)).toBe(true);
    });

    it('is true for a single-identifier policy, which the API also enforces', () => {
        expect(getIsSignInRestricted(LOGIN_IDENTIFIER_POLICY.USERNAME)).toBe(true);
    });
});

describe('getCanShowSignInRestriction', () => {
    const primaryAddresses = [buildAddress({ Email: 'eric.norbert@proton.me', Status: 1, Receive: 1, Send: 1 })];

    it('is true for a Proton account with a username', () => {
        expect(getCanShowSignInRestriction({ user: buildUser({ Name: 'eric.norbert' }) })).toBe(true);
    });

    it('is true for a Proton account with only a primary address', () => {
        expect(getCanShowSignInRestriction({ user: buildUser({ Name: '' }), addresses: primaryAddresses })).toBe(true);
    });

    it('is false without a username or an enabled address', () => {
        const addresses = [buildAddress({ Email: 'disabled@proton.me', Status: 0 })];
        expect(getCanShowSignInRestriction({ user: buildUser({ Name: '' }), addresses })).toBe(false);
    });

    it.each([UserType.MANAGED, UserType.EXTERNAL])('is false for user type %s, which the API rejects', (Type) => {
        expect(
            getCanShowSignInRestriction({
                user: buildUser({ Name: 'eric.norbert', Type }),
                addresses: primaryAddresses,
            })
        ).toBe(false);
    });
});
