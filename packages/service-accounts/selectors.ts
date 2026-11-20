import { createSelector } from '@reduxjs/toolkit';

import { selectDomains } from '@proton/account/domains';
import { selectEntitlements } from '@proton/account/entitlements';
import { selectMembers } from '@proton/account/members';
import { selectOrganization } from '@proton/account/organization';
import { selectOrganizationKey } from '@proton/account/organizationKey';
import { selectUserPermissions } from '@proton/account/userPermissions';
import { EntitlementName } from '@proton/payments/core/entitlements/entitlement-names';
import { getTotalEntitlementQuantity } from '@proton/payments/core/entitlements/helpers';
import isTruthy from '@proton/utils/isTruthy';

import { type ServiceAccountManagerOption, getServiceAccountDomain } from './helpers';
import { selectServiceAccounts } from './slice';

export const selectServiceAccountsList = createSelector(selectServiceAccounts, (model) => {
    // Only surface a fetch error when there is no cached list to fall back to.
    const error = model.value === undefined ? model.error : undefined;
    return { accounts: model.value || [], loading: model.value === undefined && !error, error };
});

export const selectServiceAccountManagerOptions = createSelector(selectMembers, (members) =>
    Object.fromEntries(
        (members.value || []).map((member): [string, ServiceAccountManagerOption] => [
            member.ID,
            { MemberID: member.ID, Name: member.Name, Email: member.Addresses?.[0]?.Email || '' },
        ])
    )
);

export const normalizeServiceAccountName = (name = '') => name.trim().toLowerCase();

/** Normalized names a new service account cannot take: service accounts are members, so member names count too. */
export const selectServiceAccountUsedNames = createSelector(
    [selectServiceAccountsList, selectServiceAccountManagerOptions],
    ({ accounts }, members) =>
        new Set(
            [...accounts, ...Object.values(members)]
                .map(({ Name }) => normalizeServiceAccountName(Name))
                .filter(Boolean)
        )
);

/** Display names of each service account's managers, keyed by service account member ID. */
export const selectServiceAccountManagerNames = createSelector(
    [selectServiceAccountsList, selectServiceAccountManagerOptions],
    ({ accounts }, members) =>
        Object.fromEntries(
            accounts.map((account) => [
                account.MemberID,
                account.Managers.map(({ MemberID }) => members[MemberID]?.Name || members[MemberID]?.Email).filter(
                    isTruthy
                ),
            ])
        )
);

// Mirrors the API's sanity limit, which applies whatever the entitlement says.
const MAX_SERVICE_ACCOUNTS = 1000;

export const selectServiceAccountPermissions = createSelector(
    [
        selectUserPermissions,
        selectOrganizationKey,
        selectOrganization,
        selectEntitlements,
        selectDomains,
        selectServiceAccountsList,
    ],
    (userPermissions, organizationKey, organization, entitlements, domains, list) => {
        const permissions = userPermissions.value?.permissions;
        const hasOrgKey = !!organizationKey.value?.privateKey;
        const loadingOrgKey = !organizationKey.value && !organizationKey.error;
        const hasCreatePermission = !!permissions?.['account.service_account.create'];
        const canManage = !!permissions?.['account.service_account.update'];
        const canUpdate = !!permissions?.['account.user.update'];
        const tokenCreationDisabled = !!organization.value?.Settings?.PersonalAccessTokenCreationDisabled;
        const loadingLimit = list.loading || (!entitlements.value && !entitlements.error);
        const maxServiceAccounts = Math.min(
            getTotalEntitlementQuantity(entitlements.value, EntitlementName.MaxServiceAccounts),
            MAX_SERVICE_ACCOUNTS
        );
        const limitReached = !loadingLimit && list.accounts.length >= maxServiceAccounts;
        const domain = getServiceAccountDomain(domains.value);
        const loadingDomains = !domains.value && !domains.error;
        return {
            hasCreatePermission,
            canCreate:
                hasCreatePermission &&
                hasOrgKey &&
                !tokenCreationDisabled &&
                !loadingLimit &&
                !limitReached &&
                !!domain,
            showMissingDomainWarning: hasCreatePermission && !loadingDomains && !domain,
            maxServiceAccounts,
            limitReached,
            // Granting access encrypts the service account keys, so it needs the organization key; revoking does not.
            canAssignManagers: canManage && hasOrgKey,
            canRemoveManagers: canManage,
            canUpdate,
            canDelete: !!permissions?.['account.service_account.delete'],
            canEdit: canManage || canUpdate,
            canReadMembers: !!permissions?.['account.user.read'],
            tokenCreationDisabled,
            showUnlockOrgKeyWarning: !loadingOrgKey && (hasCreatePermission || canManage) && !hasOrgKey,
        };
    }
);
