import { select } from 'redux-saga/effects';

import type { VaultShareItem } from '../../../store/reducers';
import { selectOrganizationVaultCreationPolicy } from '../../../store/selectors/organization';
import type { Maybe, MaybeNull, Share, ShareType } from '../../../types';
import { OrganizationVaultCreateMode } from '../../../types';
import { and } from '../../../utils/fp/predicates';
import { logger } from '../../../utils/logger';
import { isActiveVault, isOwnVault, isWritableVault } from '../../vaults/vault.predicates';
import { createVault } from '../../vaults/vault.requests';

export function* createDefaultVault(shares: Share[]): Generator<any, Maybe<VaultShareItem>> {
    const hasDefaultVault = shares.some(and(isActiveVault, isWritableVault, isOwnVault));
    if (hasDefaultVault) return;

    const vaultPolicy: MaybeNull<OrganizationVaultCreateMode> = yield select(selectOrganizationVaultCreationPolicy);
    const canCreateVault = vaultPolicy !== OrganizationVaultCreateMode.ONLYORGADMINS;

    /* When syncing, if no owned writable vault exists, create it.
     * For b2b users, don't create vault if org doesn't allow it.
     * This accounts for first login, default vault being disabled. */
    if (canCreateVault) {
        logger.info(`[Sync] No default vault found, creating initial vault..`);
        const defaultVault: Share<ShareType.Vault> = yield createVault({
            content: {
                name: 'Personal',
                description: 'Personal vault',
                display: {},
            },
        });

        return defaultVault;
    } else {
        logger.info(`[Sync] No default vault found, cannot create one due to organization policy.`);
    }
}
