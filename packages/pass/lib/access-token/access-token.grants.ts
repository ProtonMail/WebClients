import { c } from 'ttag';

import type { PersonalAccessTokenShareResponse } from '../../types/api/pass';
import type { ShareId } from '../../types/crypto/pass-types';
import { ShareRole, ShareType } from '../../types/data/shares';

/** Roles the PAT create/manage UI may assign (never Manager). */
export type PatUiGrantRole = ShareRole.READ | ShareRole.WRITE;

export type PatVaultGrant = { shareId: ShareId; role: PatUiGrantRole };

/** A selected vault and its role. Can be Manager when kept from a CLI grant. */
export type PatVaultSelection = { shareId: ShareId; role: ShareRole };

/** Viewer / Editor options in PAT create/manage (vault list is writable-only). */
export const PAT_UI_ROLES: PatUiGrantRole[] = [ShareRole.READ, ShareRole.WRITE];

const isPatUiGrantRole = (role: ShareRole): role is PatUiGrantRole =>
    role === ShareRole.READ || role === ShareRole.WRITE;

export type PatGrantDiff = {
    /** New vault grants (no existing PAT grant on that vault). */
    toAdd: PatVaultGrant[];
    /** Revoke when vault is removed from selection (not a role change). */
    toRemovePatShareIds: ShareId[];
    /** Role change: revoke existing PAT share then re-grant (API requires revoke first). */
    roleUpdates: { revokePatShareId: ShareId; grant: PatVaultGrant }[];
};

const isVaultGrant = (grant: PersonalAccessTokenShareResponse) => grant.TargetType === ShareType.Vault;

/**
 * Computes revoke/grant steps to reach `desired` grants for vaults in `manageableVaultShareIds`.
 * A vault kept with its current role (e.g. Manager) is left untouched.
 */
export const diffPatGrants = (
    current: PersonalAccessTokenShareResponse[],
    desired: PatVaultSelection[],
    manageableVaultShareIds: Set<ShareId>
): PatGrantDiff => {
    const desiredByShareId = new Map(desired.map((g) => [g.shareId, g.role]));
    const vaultGrants = current.filter((g) => isVaultGrant(g) && manageableVaultShareIds.has(g.ParentShareID));

    const toAdd: PatVaultGrant[] = [];
    const toRemovePatShareIds: ShareId[] = [];
    const roleUpdates: PatGrantDiff['roleUpdates'] = [];

    for (const grant of vaultGrants) {
        const wantedRole = desiredByShareId.get(grant.ParentShareID);
        if (wantedRole === undefined) {
            toRemovePatShareIds.push(grant.ShareID);
            continue;
        }

        if (grant.ShareRoleID !== wantedRole && isPatUiGrantRole(wantedRole)) {
            roleUpdates.push({
                revokePatShareId: grant.ShareID,
                grant: { shareId: grant.ParentShareID, role: wantedRole },
            });
        }
    }

    for (const { shareId, role } of desired) {
        if (!manageableVaultShareIds.has(shareId) || !isPatUiGrantRole(role)) continue;

        const existing = vaultGrants.find((g) => g.ParentShareID === shareId);
        if (!existing) toAdd.push({ shareId, role });
    }

    return {
        toAdd,
        toRemovePatShareIds: [...new Set(toRemovePatShareIds)],
        roleUpdates,
    };
};

const patRoleLabel = (role: ShareRole): string => {
    switch (role) {
        case ShareRole.READ:
            return c('Info').t`Viewer`;
        case ShareRole.WRITE:
            return c('Info').t`Editor`;
        case ShareRole.MANAGER:
            return c('Info').t`Manager`;
        default:
            return role;
    }
};

/** Summary for token list (AC9). Includes Manager when present. */
export const formatPatRoleSummary = (grants: PersonalAccessTokenShareResponse[]): string | null => {
    const vaultRoles = grants.filter(isVaultGrant).map((g) => g.ShareRoleID as ShareRole);
    if (vaultRoles.length === 0) return c('Info').t`No vault access`;

    const distinct = [...new Set(vaultRoles.map(patRoleLabel))];
    if (distinct.length === 1) return distinct[0];
    return distinct.sort().join(' · ');
};

export const patGrantSelectionFromAccessGrants = (
    grants: PersonalAccessTokenShareResponse[],
    manageableShareIds: Set<ShareId>
): Map<ShareId, ShareRole> => {
    const selection = new Map<ShareId, ShareRole>();

    for (const grant of grants) {
        if (isVaultGrant(grant) && manageableShareIds.has(grant.ParentShareID)) {
            selection.set(grant.ParentShareID, grant.ShareRoleID as ShareRole);
        }
    }

    return selection;
};

export const patGrantSelectionEquals = (a: Map<ShareId, ShareRole>, b: Map<ShareId, ShareRole>): boolean => {
    if (a.size !== b.size) return false;
    for (const [shareId, role] of a) if (b.get(shareId) !== role) return false;
    return true;
};
