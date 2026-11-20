import type { ThunkAction, UnknownAction } from '@reduxjs/toolkit';
import { c } from 'ttag';

import { type AddressesState, addressesThunk } from '@proton/account/addresses';
import { type DomainsState, domainsThunk } from '@proton/account/domains';
import type { KtState } from '@proton/account/kt';
import { getKTUserContext } from '@proton/account/kt/actions';
import { type OrganizationState, organizationThunk } from '@proton/account/organization';
import { type OrganizationKeyState, organizationKeyThunk } from '@proton/account/organizationKey';
import type { UserKeysState } from '@proton/account/userKeys';
import { type UserPermissionsState, userPermissionsThunk } from '@proton/account/userPermissions';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types/interface';
import { getApiError, getApiErrorMessage } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import {
    checkMemberAddressAvailability,
    disableMember as disableMemberConfig,
    enableMember as enableMemberConfig,
    updateName,
} from '@proton/shared/lib/api/members';
import {
    createServiceAccountAccess,
    createServiceAccount as createServiceAccountConfig,
    deleteServiceAccountAccess,
    deleteServiceAccount as deleteServiceAccountConfig,
} from '@proton/shared/lib/api/serviceAccounts';
import { HTTP_STATUS_CODE } from '@proton/shared/lib/constants';
import { getEmailParts, validateEmailAddress } from '@proton/shared/lib/helpers/email';
import type { ServiceAccount, ServiceAccountAccessInput } from '@proton/shared/lib/interfaces/ServiceAccount';
import { ServiceAccountState } from '@proton/shared/lib/interfaces/ServiceAccount';
import { getOrganizationKeyInfo, validateOrganizationKey } from '@proton/shared/lib/organization/helper';
import noop from '@proton/utils/noop';

import {
    type ServiceAccountManagerOption,
    getManagerChanges,
    getServiceAccountDomain,
    getServiceAccountEmail,
} from './helpers';
import {
    clearServiceAccountKeys,
    getServiceAccountAccessPayload,
    getServiceAccountKeys,
    setupServiceAccountKeys,
} from './keys';
import {
    type ServiceAccountsState,
    refetchServiceAccounts,
    removeServiceAccount,
    selectServiceAccounts,
    setServiceAccountState,
    upsertServiceAccount,
} from './slice';

export type ServiceAccountsThunkState = ServiceAccountsState &
    UserPermissionsState &
    OrganizationState &
    OrganizationKeyState &
    AddressesState &
    DomainsState &
    KtState &
    UserKeysState;

type ServiceAccountsThunk<T> = ThunkAction<Promise<T>, ServiceAccountsThunkState, ProtonThunkArguments, UnknownAction>;

/** Why a name cannot give a new service account an address, shown on the name field. */
class ServiceAccountEmailError extends Error {}

const MAX_EMAIL_ATTEMPTS = 20;

/**
 * Find a free address for a new service account: its name on the custom domain, followed by a number when that is
 * taken (`ci-bot2@…`). The address is generated, so the admin should not have to pick another name for it.
 */
const getAvailableServiceAccountEmail = (name: string): ServiceAccountsThunk<string> => {
    return async (dispatch, _, extra) => {
        const domain = getServiceAccountDomain(await dispatch(domainsThunk()));
        if (!domain) {
            throw new ServiceAccountEmailError(
                c('Error').t`Add and verify a custom domain to create service accounts.`
            );
        }
        for (let number = 1; number <= MAX_EMAIL_ATTEMPTS; number++) {
            const email = getServiceAccountEmail(name, domain, number);
            if (!validateEmailAddress(email)) {
                throw new ServiceAccountEmailError(
                    c('Error').t`This name does not make a valid address. Try another name.`
                );
            }
            const [Local, Domain] = getEmailParts(email);
            try {
                // Each address depends on the previous one being taken, so they are checked one after another.
                await extra.api({ ...checkMemberAddressAvailability({ Local, Domain }), silence: true });
                return email;
            } catch (error) {
                const { status, message } = getApiError(error);
                if (status === HTTP_STATUS_CODE.UNPROCESSABLE_ENTITY) {
                    throw new ServiceAccountEmailError(
                        message || c('Error').t`This name does not make a valid address. Try another name.`
                    );
                }
                if (status !== HTTP_STATUS_CODE.CONFLICT) {
                    throw error;
                }
            }
        }
        throw new ServiceAccountEmailError(c('Error').t`No free address was found for this name. Try another name.`);
    };
};

/**
 * Find the address a new service account with this name would get, or why it cannot get one. Resolves with neither
 * when the check itself failed, since creating the account looks for a free address again.
 */
export const checkServiceAccountEmail = (name: string): ServiceAccountsThunk<{ email?: string; error?: string }> => {
    return async (dispatch) => {
        try {
            return { email: await dispatch(getAvailableServiceAccountEmail(name)) };
        } catch (error) {
            return error instanceof ServiceAccountEmailError ? { error: error.message } : {};
        }
    };
};

const createServiceAccountMember = (name: string, email?: string): ServiceAccountsThunk<ServiceAccount> => {
    return async (dispatch, _, extra) => {
        const { permissions } = await dispatch(userPermissionsThunk());
        if (!permissions?.['account.service_account.create']) {
            throw new Error(c('Error').t`You do not have permission to create service accounts.`);
        }
        // The creation request checks the address again, in case it was taken since it was found.
        const Email = email || (await dispatch(getAvailableServiceAccountEmail(name)));
        // The creation response has no managers or state: a new account has no manager yet.
        const { ServiceAccount: account } = await extra.api<{
            ServiceAccount: Omit<ServiceAccount, 'Managers' | 'State'>;
        }>({
            ...createServiceAccountConfig({ Name: name, Email }),
            silence: true,
        });
        return { ...account, Managers: [], State: ServiceAccountState.NoManager };
    };
};

export const saveServiceAccount = ({
    account,
    name,
    managers,
    setupKeys,
}: {
    account: ServiceAccount;
    name: string;
    managers: ServiceAccountManagerOption[];
    /** Set for accounts created in this session, whose keys may not be set up yet. */
    setupKeys?: boolean;
}): ServiceAccountsThunk<void> => {
    return async (dispatch, _, extra) => {
        const { api, config } = extra;
        // Reconcile with the latest server state so retrying a partially completed save is safe.
        const [accounts, { permissions }] = await Promise.all([
            dispatch(refetchServiceAccounts()),
            dispatch(userPermissionsThunk()),
        ]);
        const current = accounts.find(({ MemberID }) => MemberID === account.MemberID);
        if (!current) {
            throw new Error(c('Error').t`This service account no longer exists.`);
        }
        const intended = getManagerChanges(account.Managers, managers);
        const currentIDs = new Set(current.Managers.map(({ MemberID }) => MemberID));
        const removedIDs = new Set(intended.removed.map(({ MemberID }) => MemberID));
        const added = intended.added.filter(({ MemberID }) => !currentIDs.has(MemberID));
        const removed = current.Managers.filter(({ MemberID }) => removedIDs.has(MemberID));
        const rename = account.Name !== name && current.Name !== name;
        if (
            ((added.length || removed.length) && !permissions?.['account.service_account.update']) ||
            (rename && !permissions?.['account.user.update'])
        ) {
            throw new Error(c('Error').t`You do not have permission to make these changes.`);
        }
        try {
            // Only key setup and new grants need the organization key; renames and removals are plain API calls.
            let grants: ServiceAccountAccessInput[] = [];
            if (added.length || setupKeys) {
                const [organization, organizationKey, addresses] = await Promise.all([
                    dispatch(organizationThunk()),
                    dispatch(organizationKeyThunk()),
                    dispatch(addressesThunk()),
                ]);
                const organizationKeyError = validateOrganizationKey(
                    getOrganizationKeyInfo(organization, organizationKey, addresses)
                );
                if (organizationKeyError) {
                    throw new Error(organizationKeyError);
                }
                if (!organizationKey?.privateKey) {
                    throw new Error('Missing key');
                }
                const ktUserContext = await dispatch(getKTUserContext());
                const context = { api, config, serviceAccount: current, organizationKey, ktUserContext };
                await setupServiceAccountKeys(context);
                if (added.length) {
                    // Prepare all encrypted grants before changing manager assignments.
                    const keys = await getServiceAccountKeys(context);
                    try {
                        grants = await Promise.all(
                            added.map(({ Email }) =>
                                getServiceAccountAccessPayload({ api, ktUserContext, keys, targetEmail: Email })
                            )
                        );
                    } finally {
                        await clearServiceAccountKeys(keys);
                    }
                }
            }
            if (rename) {
                await api({ ...updateName(account.MemberID, name), silence: true });
            }
            for (const grant of grants) {
                await api(createServiceAccountAccess(account.MemberID, grant));
            }
            // Add replacements before removing old managers to avoid a temporary orphaned account.
            for (const manager of removed) {
                await api(deleteServiceAccountAccess(account.MemberID, manager.DelegatedAccessID));
            }
        } finally {
            // Part of the save may have succeeded before a failure. A failed refresh must not hide the outcome.
            await dispatch(refetchServiceAccounts()).catch(noop);
        }
    };
};

export const deleteServiceAccount = ({ account }: { account: ServiceAccount }): ServiceAccountsThunk<void> => {
    return async (dispatch, _, extra) => {
        const { permissions } = await dispatch(userPermissionsThunk());
        if (!permissions?.['account.service_account.delete']) {
            throw new Error(c('Error').t`You do not have permission to delete service accounts.`);
        }
        dispatch(removeServiceAccount(account));
        try {
            await extra.api(deleteServiceAccountConfig(account.MemberID));
        } catch (error) {
            dispatch(upsertServiceAccount(account));
            throw error;
        }
    };
};

export const setServiceAccountEnabled = ({
    account,
    enabled,
}: {
    account: ServiceAccount;
    enabled: boolean;
}): ServiceAccountsThunk<void> => {
    return async (dispatch, getState, extra) => {
        const { permissions } = await dispatch(userPermissionsThunk());
        if (!permissions?.['account.user.update']) {
            throw new Error(c('Error').t`You do not have permission to update service accounts.`);
        }
        // The API derives the state in this order: disabled, no manager, no valid token, active. Token validity is only
        // known to the server, so enabling an account that has managers needs a refetch.
        let State: ServiceAccountState | undefined;
        if (!enabled) {
            State = ServiceAccountState.Disabled;
        } else if (account.Managers.length === 0) {
            State = ServiceAccountState.NoManager;
        }
        // Only the state changes: the rest of `account` may be older than the list, e.g. after a reload.
        const previous = selectServiceAccounts(getState()).value?.find(({ MemberID }) => MemberID === account.MemberID);
        if (State !== undefined) {
            dispatch(setServiceAccountState({ MemberID: account.MemberID, State }));
        }
        try {
            await extra.api((enabled ? enableMemberConfig : disableMemberConfig)(account.MemberID));
        } catch (error) {
            if (previous) {
                dispatch(setServiceAccountState(previous));
            }
            throw error;
        }
        if (State === undefined) {
            await dispatch(refetchServiceAccounts()).catch(noop);
        }
    };
};

/** A service account was created but its keys or managers could not be set up. Retrying must reuse it. */
export class ServiceAccountSetupError extends Error {
    constructor(
        readonly account: ServiceAccount,
        error: unknown
    ) {
        super(getApiErrorMessage(error) || (error instanceof Error ? error.message : undefined));
    }
}

export const createServiceAccount = ({
    name,
    email,
    managers,
    pending,
}: {
    name: string;
    /** A free address found for the name, otherwise one is looked for. */
    email?: string;
    managers: ServiceAccountManagerOption[];
    /** An account created by a previous attempt whose setup failed. */
    pending?: ServiceAccount;
}): ServiceAccountsThunk<void> => {
    return async (dispatch) => {
        const created = pending || (await dispatch(createServiceAccountMember(name, email)));
        try {
            await dispatch(saveServiceAccount({ account: created, name, managers, setupKeys: true }));
        } catch (error) {
            throw new ServiceAccountSetupError(created, error);
        }
    };
};
