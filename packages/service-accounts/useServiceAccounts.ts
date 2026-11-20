import { useEffect } from 'react';

import type { ThunkDispatch, UnknownAction } from '@reduxjs/toolkit';

import { domainsThunk } from '@proton/account/domains';
import { type EntitlementsState, entitlementsThunk } from '@proton/account/entitlements';
import { membersThunk } from '@proton/account/members';
import { organizationKeyThunk } from '@proton/account/organizationKey';
import { userPermissionsThunk } from '@proton/account/userPermissions';
import { baseUseDispatch, baseUseSelector as useSelector } from '@proton/react-redux-store/ProtonStoreContext';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types/interface';
import type { ServiceAccount } from '@proton/shared/lib/interfaces/ServiceAccount';
import noop from '@proton/utils/noop';

import {
    type ServiceAccountsThunkState,
    checkServiceAccountEmail,
    createServiceAccount,
    deleteServiceAccount,
    saveServiceAccount,
    setServiceAccountEnabled,
} from './actions';
import {
    selectServiceAccountManagerNames,
    selectServiceAccountManagerOptions,
    selectServiceAccountPermissions,
    selectServiceAccountUsedNames,
    selectServiceAccountsList,
} from './selectors';
import { refetchServiceAccounts } from './slice';

export const useServiceAccounts = () => {
    // The slice is only in the account app's store, so the shared typed hooks do not know it.
    const dispatch =
        baseUseDispatch<
            ThunkDispatch<ServiceAccountsThunkState & EntitlementsState, ProtonThunkArguments, UnknownAction>
        >();
    const { accounts, loading, error } = useSelector(selectServiceAccountsList);
    const members = useSelector(selectServiceAccountManagerOptions);
    const managerNames = useSelector(selectServiceAccountManagerNames);
    const permissions = useSelector(selectServiceAccountPermissions);
    const usedNames = useSelector(selectServiceAccountUsedNames);

    useEffect(() => {
        // No event reports every service account change (manager changes in particular), so refetch on each visit.
        void dispatch(refetchServiceAccounts()).catch(noop);
        void dispatch(userPermissionsThunk()).catch(noop);
        void dispatch(organizationKeyThunk()).catch(noop);
        void dispatch(entitlementsThunk()).catch(noop);
        void dispatch(domainsThunk()).catch(noop);
    }, [dispatch]);

    useEffect(() => {
        if (permissions.canReadMembers) {
            void dispatch(membersThunk()).catch(noop);
        }
    }, [dispatch, permissions.canReadMembers]);

    return {
        accounts,
        members,
        managerNames,
        usedNames,
        permissions,
        loading,
        error,
        refresh: () => dispatch(refetchServiceAccounts()).then(noop, noop),
        checkEmail: (name: string) => dispatch(checkServiceAccountEmail(name)),
        create: (args: Parameters<typeof createServiceAccount>[0]) => dispatch(createServiceAccount(args)),
        save: (args: Parameters<typeof saveServiceAccount>[0]) => dispatch(saveServiceAccount(args)),
        remove: (account: ServiceAccount) => dispatch(deleteServiceAccount({ account })),
        setEnabled: (account: ServiceAccount, enabled: boolean) =>
            dispatch(setServiceAccountEnabled({ account, enabled })),
    };
};
