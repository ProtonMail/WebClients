import { ADDRESS_TYPE } from '@proton/shared/lib/constants';
import { UserType } from '@proton/shared/lib/interfaces/User';
import {
    LOGIN_IDENTIFIER_POLICY,
    RESTRICTED_LOGIN_IDENTIFIER_POLICY,
} from '@proton/shared/lib/interfaces/UserSettings';
import { buildUser } from '@proton/shared/testing/buildUser';

import { buildAddress } from '../testing/buildAddress';
import { getCanShowSignInRestriction, getIsSignInRestricted, getSignInIdentifiers } from './helpers';

describe('getSignInIdentifiers', () => {
    it('uses the original address, not the default address', () => {
        const user = buildUser({ Name: 'eric.norbert' });
        const addresses = [
            buildAddress({ Email: 'default@proton.me', Type: ADDRESS_TYPE.TYPE_ALIAS, Status: 1 }),
            buildAddress({ Email: 'eric.norbert@proton.me', Type: ADDRESS_TYPE.TYPE_ORIGINAL, Status: 1 }),
        ];

        expect(getSignInIdentifiers(user, addresses)).toEqual({
            username: 'eric.norbert',
            primaryEmail: 'eric.norbert@proton.me',
            signInDomains: ['proton.me'],
        });
    });

    it('lists the domains of enabled original addresses in a fixed order', () => {
        const user = buildUser({ Name: 'eric.norbert' });
        const addresses = [
            buildAddress({ Email: 'eric.norbert@protonmail.ch', Type: ADDRESS_TYPE.TYPE_ORIGINAL, Status: 1 }),
            buildAddress({ Email: 'eric.norbert@ProtonMail.com', Type: ADDRESS_TYPE.TYPE_ORIGINAL, Status: 1 }),
            buildAddress({ Email: 'eric.norbert@proton.me', Type: ADDRESS_TYPE.TYPE_ORIGINAL, Status: 1 }),
        ];

        expect(getSignInIdentifiers(user, addresses).signInDomains).toEqual([
            'proton.me',
            'protonmail.com',
            'protonmail.ch',
        ]);
    });

    it('skips domains whose original address is disabled or that only have other address types', () => {
        const user = buildUser({ Name: 'eric.norbert' });
        const addresses = [
            buildAddress({ Email: 'eric.norbert@proton.me', Type: ADDRESS_TYPE.TYPE_ORIGINAL, Status: 1 }),
            buildAddress({ Email: 'eric.norbert@protonmail.com', Type: ADDRESS_TYPE.TYPE_ORIGINAL, Status: 0 }),
            buildAddress({ Email: 'eric@protonmail.ch', Type: ADDRESS_TYPE.TYPE_ALIAS, Status: 1 }),
        ];

        expect(getSignInIdentifiers(user, addresses).signInDomains).toEqual(['proton.me']);
    });

    it('has no primary email when the original address is disabled', () => {
        const user = buildUser({ Name: 'eric.norbert' });
        const addresses = [
            buildAddress({ Email: 'eric.norbert@proton.me', Type: ADDRESS_TYPE.TYPE_ORIGINAL, Status: 0 }),
            buildAddress({ Email: 'alias@proton.me', Type: ADDRESS_TYPE.TYPE_ALIAS, Status: 1 }),
        ];

        expect(getSignInIdentifiers(user, addresses).primaryEmail).toBeUndefined();
    });

    it('has no primary email without an original address', () => {
        const user = buildUser({ Name: '' });
        const addresses = [buildAddress({ Email: 'eric@example.com', Type: ADDRESS_TYPE.TYPE_EXTERNAL, Status: 1 })];

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
    const addressesWithOriginal = [
        buildAddress({
            Email: 'eric.norbert@proton.me',
            Type: ADDRESS_TYPE.TYPE_ORIGINAL,
            Status: 1,
            Receive: 1,
            Send: 1,
        }),
        buildAddress({ Email: 'alias@proton.me', Type: ADDRESS_TYPE.TYPE_ALIAS, Status: 1 }),
    ];

    it('is true for a Proton account with a username', () => {
        expect(getCanShowSignInRestriction({ user: buildUser({ Name: 'eric.norbert' }) })).toBe(true);
    });

    it('is true for a Proton account with only a primary address', () => {
        expect(getCanShowSignInRestriction({ user: buildUser({ Name: '' }), addresses: addressesWithOriginal })).toBe(
            true
        );
    });

    it('is false with a single address, where restricting changes nothing', () => {
        const addresses = [
            buildAddress({ Email: 'eric.norbert@proton.me', Type: ADDRESS_TYPE.TYPE_ORIGINAL, Status: 1 }),
        ];
        expect(getCanShowSignInRestriction({ user: buildUser({ Name: 'eric.norbert' }), addresses })).toBe(false);
    });

    it('is false without a username or an enabled address', () => {
        const addresses = [buildAddress({ Email: 'disabled@proton.me', Status: 0 })];
        expect(getCanShowSignInRestriction({ user: buildUser({ Name: '' }), addresses })).toBe(false);
    });

    it('is false for an SSO account', () => {
        const user = buildUser({ Name: 'eric.norbert', Flags: { ...buildUser().Flags, sso: true } });
        expect(getCanShowSignInRestriction({ user, addresses: addressesWithOriginal })).toBe(false);
    });

    it.each([UserType.MANAGED, UserType.EXTERNAL])('is false for user type %s, which the API rejects', (Type) => {
        expect(
            getCanShowSignInRestriction({
                user: buildUser({ Name: 'eric.norbert', Type }),
                addresses: addressesWithOriginal,
            })
        ).toBe(false);
    });
});
