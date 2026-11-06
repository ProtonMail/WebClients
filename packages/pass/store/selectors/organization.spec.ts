import {
    OrganizationAliasCreateMode,
    OrganizationCanStorePasskeyMode,
    OrganizationCanStoreTotpMode,
    OrganizationItemShareMode,
    OrganizationPublicLinkMode,
} from '../../types/api/pass';
import type { OrganizationSettings } from '../../types/data/organization';
import type { MaybeNull } from '../../types/utils';
import { INITIAL_ORGANIZATION_SETTINGS } from '../reducers/organization';
import type { State } from '../types';
import {
    selectOrgAliasCreationDisabled,
    selectOrgItemSharingDisabled,
    selectOrgPasskeyDisabled,
    selectOrgPublicLinkDisabled,
    selectOrgTOTPDisabled,
} from './organization';

const getState = (settings: MaybeNull<Partial<OrganizationSettings>>) =>
    ({
        organization: settings ? { settings: { ...INITIAL_ORGANIZATION_SETTINGS, ...settings } } : null,
    }) as unknown as State;

describe('organization policy selectors', () => {
    test('nothing is disabled without an organization', () => {
        const state = getState(null);
        expect(selectOrgAliasCreationDisabled(state)).toBe(false);
        expect(selectOrgItemSharingDisabled(state)).toBe(false);
        expect(selectOrgPublicLinkDisabled(state)).toBe(false);
        expect(selectOrgTOTPDisabled(state)).toBe(false);
        expect(selectOrgPasskeyDisabled(state)).toBe(false);
    });

    test('alias creation is disabled only when set to `NOBODY`', () => {
        const nobody = getState({ AliasCreateMode: OrganizationAliasCreateMode.NOBODY });
        const allowed = getState({ AliasCreateMode: OrganizationAliasCreateMode.ALLOWEDFORALLMEMBERS });
        expect(selectOrgAliasCreationDisabled(nobody)).toBe(true);
        expect(selectOrgAliasCreationDisabled(allowed)).toBe(false);
    });

    test('item sharing and public links follow their own mode', () => {
        const state = getState({
            ItemShareMode: OrganizationItemShareMode.DISABLED,
            PublicLinkMode: OrganizationPublicLinkMode.ALLOWED,
        });
        expect(selectOrgItemSharingDisabled(state)).toBe(true);
        expect(selectOrgPublicLinkDisabled(state)).toBe(false);
    });

    test('TOTP and passkey storage policies are independent', () => {
        const totpOnly = getState({ CanStoreTotp: OrganizationCanStoreTotpMode.DISABLED });
        expect(selectOrgTOTPDisabled(totpOnly)).toBe(true);
        expect(selectOrgPasskeyDisabled(totpOnly)).toBe(false);

        const passkeyOnly = getState({ CanStorePasskey: OrganizationCanStorePasskeyMode.DISABLED });
        expect(selectOrgTOTPDisabled(passkeyOnly)).toBe(false);
        expect(selectOrgPasskeyDisabled(passkeyOnly)).toBe(true);
    });

    test('settings cached before the storage policies existed allow storing', () => {
        const state = getState({ CanStoreTotp: undefined, CanStorePasskey: undefined });
        expect(selectOrgTOTPDisabled(state)).toBe(false);
        expect(selectOrgPasskeyDisabled(state)).toBe(false);
    });
});
