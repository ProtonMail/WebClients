import { getModelState } from '@proton/account/testing/getModelState';
import { EntitlementName } from '@proton/payments/core/entitlements/entitlement-names';
import { DOMAIN_STATE } from '@proton/shared/lib/interfaces/Domain';
import { ServiceAccountState } from '@proton/shared/lib/interfaces/ServiceAccount';

import {
    selectServiceAccountManagerNames,
    selectServiceAccountPermissions,
    selectServiceAccountUsedNames,
    selectServiceAccountsList,
} from './selectors';

const getState = ({
    permissions = {} as Record<string, boolean>,
    hasOrgKey = true,
    organizationKey = getModelState<object>({ Key: {}, privateKey: hasOrgKey ? {} : undefined }),
    tokenCreationDisabled = false,
    serviceAccounts = getModelState<any[]>([]),
    members = [] as any[],
    /** `null`: entitlements still loading; `'none'`: loaded without max-service-accounts. */
    maxServiceAccounts = 10 as number | null | 'none',
    /** `null`: domains still loading. */
    domains = [
        { DomainName: 'unverified.test', State: DOMAIN_STATE.DOMAIN_STATE_DEFAULT, Flags: { 'mail-intent': true } },
        { DomainName: 'example.test', State: DOMAIN_STATE.DOMAIN_STATE_VERIFIED, Flags: { 'mail-intent': true } },
    ] as any[] | null,
} = {}) =>
    ({
        userPermissions: getModelState({ permissions }),
        organizationKey,
        organization: getModelState({ Settings: { PersonalAccessTokenCreationDisabled: tokenCreationDisabled } }),
        serviceAccounts,
        members: getModelState(members),
        domains: getModelState(domains ?? undefined),
        entitlements: getModelState(
            maxServiceAccounts === null
                ? undefined
                : {
                      UserEntitlements: [],
                      MemberEntitlements: [],
                      OrganizationEntitlements:
                          maxServiceAccounts === 'none'
                              ? []
                              : [{ Name: EntitlementName.MaxServiceAccounts, Quantity: maxServiceAccounts }],
                  }
        ),
    }) as any;

describe('selectServiceAccountPermissions', () => {
    const all = {
        'account.service_account.create': true,
        'account.service_account.update': true,
        'account.service_account.delete': true,
        'account.user.update': true,
    };

    it('grants everything with all permissions and an unlocked organization key', () => {
        expect(selectServiceAccountPermissions(getState({ permissions: all }))).toMatchObject({
            canCreate: true,
            canAssignManagers: true,
            canRemoveManagers: true,
            canEdit: true,
            canDelete: true,
            showUnlockOrgKeyWarning: false,
        });
    });

    it('allows removing but not assigning managers or creating without the organization key', () => {
        expect(selectServiceAccountPermissions(getState({ permissions: all, hasOrgKey: false }))).toMatchObject({
            canCreate: false,
            canAssignManagers: false,
            canRemoveManagers: true,
            showUnlockOrgKeyWarning: true,
        });
    });

    it('does not warn about the organization key while it is loading', () => {
        const state = getState({ permissions: all, organizationKey: getModelState<object>(undefined) });
        expect(selectServiceAccountPermissions(state).showUnlockOrgKeyWarning).toBe(false);
    });

    it('allows creation with an active custom domain', () => {
        expect(selectServiceAccountPermissions(getState({ permissions: all }))).toMatchObject({
            canCreate: true,
            showMissingDomainWarning: false,
        });
    });

    it('blocks creation and warns without an active custom domain, but not while domains are loading', () => {
        expect(selectServiceAccountPermissions(getState({ permissions: all, domains: [] }))).toMatchObject({
            canCreate: false,
            showMissingDomainWarning: true,
        });
        expect(selectServiceAccountPermissions(getState({ permissions: all, domains: null }))).toMatchObject({
            canCreate: false,
            showMissingDomainWarning: false,
        });
        expect(selectServiceAccountPermissions(getState({ domains: [] })).showMissingDomainWarning).toBe(false);
    });

    it('blocks creation when token creation is disabled', () => {
        expect(
            selectServiceAccountPermissions(getState({ permissions: all, tokenCreationDisabled: true })).canCreate
        ).toBe(false);
    });

    it('blocks creation at the entitled limit and while the limit is unknown', () => {
        const twoAccounts = getModelState<any[]>([{ MemberID: 'a' }, { MemberID: 'b' }]);
        expect(
            selectServiceAccountPermissions(
                getState({ permissions: all, serviceAccounts: twoAccounts, maxServiceAccounts: 3 })
            )
        ).toMatchObject({ canCreate: true, limitReached: false, maxServiceAccounts: 3 });
        expect(
            selectServiceAccountPermissions(
                getState({ permissions: all, serviceAccounts: twoAccounts, maxServiceAccounts: 2 })
            )
        ).toMatchObject({ canCreate: false, limitReached: true });
        expect(selectServiceAccountPermissions(getState({ permissions: all, maxServiceAccounts: null }))).toMatchObject(
            { canCreate: false, limitReached: false }
        );
        expect(
            selectServiceAccountPermissions(
                getState({ permissions: all, serviceAccounts: getModelState<any[]>(undefined) })
            )
        ).toMatchObject({ canCreate: false, limitReached: false });
    });

    it('blocks creation when the organization has no max-service-accounts entitlement', () => {
        expect(
            selectServiceAccountPermissions(getState({ permissions: all, maxServiceAccounts: 'none' }))
        ).toMatchObject({ canCreate: false, limitReached: true, maxServiceAccounts: 0 });
    });

    it('keeps the API sanity limit even when the entitlement is higher', () => {
        expect(
            selectServiceAccountPermissions(getState({ permissions: all, maxServiceAccounts: 2000 })).maxServiceAccounts
        ).toBe(1000);
    });

    it('allows editing names with only the user update permission', () => {
        expect(
            selectServiceAccountPermissions(getState({ permissions: { 'account.user.update': true } }))
        ).toMatchObject({ canEdit: true, canAssignManagers: false, canRemoveManagers: false, canCreate: false });
    });
});

describe('selectServiceAccountsList', () => {
    it('reports loading until the first fetch and hides errors behind a cached list', () => {
        const error = new Error('offline');
        expect(selectServiceAccountsList(getState({ serviceAccounts: { ...getModelState(undefined) } }))).toMatchObject(
            { accounts: [], loading: true, error: undefined }
        );
        expect(
            selectServiceAccountsList(getState({ serviceAccounts: { ...getModelState(undefined), error } }))
        ).toMatchObject({ loading: false, error });
        expect(selectServiceAccountsList(getState({ serviceAccounts: { ...getModelState([]), error } }))).toMatchObject(
            { loading: false, error: undefined }
        );
    });
});

describe('selectServiceAccountManagerNames', () => {
    it('resolves manager names, falling back to email and skipping unknown members', () => {
        const state = getState({
            serviceAccounts: getModelState([
                {
                    MemberID: 'sa',
                    State: ServiceAccountState.Active,
                    Managers: [{ MemberID: 'a' }, { MemberID: 'b' }, { MemberID: 'unknown' }],
                },
            ]),
            members: [
                { ID: 'a', Name: 'Alice', Addresses: [{ Email: 'alice@example.test' }] },
                { ID: 'b', Name: '', Addresses: [{ Email: 'bob@example.test' }] },
            ],
        });
        expect(selectServiceAccountManagerNames(state)).toEqual({ sa: ['Alice', 'bob@example.test'] });
    });
});

describe('selectServiceAccountUsedNames', () => {
    it('includes service account and member names, normalized, without empty names', () => {
        const state = getState({
            serviceAccounts: getModelState([{ MemberID: 'sa', Name: ' CI-Bot ' }]),
            members: [
                { ID: 'a', Name: 'Alice', Addresses: [] },
                { ID: 'b', Name: '', Addresses: [] },
            ],
        });
        expect(selectServiceAccountUsedNames(state)).toEqual(new Set(['ci-bot', 'alice']));
    });
});
