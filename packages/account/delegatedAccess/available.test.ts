import { APPS } from '@proton/shared/lib/constants';

import { getIsDelegatedAccessSupportedInApp, getIsOutgoingDelegatedAccessSupportedInApp } from './available';

describe('delegated access support per app', () => {
    it('fully supports delegated access only in the Account app', () => {
        expect(getIsDelegatedAccessSupportedInApp(APPS.PROTONACCOUNT)).toBe(true);
        expect(getIsDelegatedAccessSupportedInApp(APPS.PROTONACCOUNTLITE)).toBe(false);
        expect(getIsDelegatedAccessSupportedInApp(APPS.PROTONVPN_SETTINGS)).toBe(false);
        expect(getIsDelegatedAccessSupportedInApp(undefined)).toBe(false);
    });

    it('supports the outgoing side in the Account and the lite Account apps', () => {
        expect(getIsOutgoingDelegatedAccessSupportedInApp(APPS.PROTONACCOUNT)).toBe(true);
        expect(getIsOutgoingDelegatedAccessSupportedInApp(APPS.PROTONACCOUNTLITE)).toBe(true);
        expect(getIsOutgoingDelegatedAccessSupportedInApp(APPS.PROTONVPN_SETTINGS)).toBe(false);
        expect(getIsOutgoingDelegatedAccessSupportedInApp(APPS.PROTONMAIL)).toBe(false);
        expect(getIsOutgoingDelegatedAccessSupportedInApp(undefined)).toBe(false);
    });
});
