import type { ThunkAction, UnknownAction } from '@reduxjs/toolkit';

import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { CacheType } from '@proton/redux-utilities/interface';
import { getIsOfflineError } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { getSilentApiWithAbort } from '@proton/shared/lib/api/helpers/customConfig';
import { MEMBER_PRIVATE, MEMBER_ROLE } from '@proton/shared/lib/constants';
import { getEmailParts } from '@proton/shared/lib/helpers/email';
import type { CreateMemberMode, Domain } from '@proton/shared/lib/interfaces';
import { getOrganizationKeyInfo } from '@proton/shared/lib/organization/helper';
import noop from '@proton/utils/noop';

import { type AddressesState, addressesThunk } from '../addresses';
import type { KtState } from '../kt';
import { type OrganizationState, organizationThunk } from '../organization';
import { type OrganizationKeyState, organizationKeyThunk } from '../organizationKey';
import { createMember } from './actions';
import InvalidAddressesError from './errors/InvalidAddressesError';
import UnavailableAddressesError from './errors/UnavailableAddressesError';
import { type MembersState, membersThunk } from './index';
import validateAddUser from './validateAddUser';
import validateOrganizationCapacity, { OrganizationCapacityError } from './validateOrganizationCapacity';

export interface UserTemplate {
    id: string;
    emailAddresses: string[];
    invitationEmail?: string;
    password: string;
    displayName: string;
    totalStorage: number;
    vpnAccess: boolean;
    privateSubUser: boolean;
}

export interface ImportUsersState {
    successfullyCreatedUsers: UserTemplate[];
    failedUsers: UserTemplate[];
    invalidAddresses: string[];
    invalidInvitationAddresses: string[];
    unavailableAddresses: string[];
    orphanedAddresses: string[];
}

export type ImportUsersResult =
    | { type: 'validation-error'; error: string }
    | { type: 'capacity-error'; error: OrganizationCapacityError }
    /** The user cancelled the auth prompt */
    | { type: 'cancelled' }
    /** The import was aborted through the given signal */
    | { type: 'aborted' }
    | { type: 'done'; state: ImportUsersState };

interface ValidationOptions {
    disableStorageValidation?: boolean;
    disableDomainValidation?: boolean;
    disableAddressValidation?: boolean;
}

export const importUsers = ({
    selectedUsers,
    mode,
    verifiedDomains,
    validationOptions,
    skipCapacityValidation = false,
    signal,
    onImportStart,
    onImportProgress,
}: {
    selectedUsers: UserTemplate[];
    mode: CreateMemberMode;
    verifiedDomains: Domain[];
    validationOptions: ValidationOptions;
    skipCapacityValidation?: boolean;
    signal: AbortSignal;
    /** Called once validation has passed and the users are about to be created */
    onImportStart: () => void;
    /** Called with the number of users that have been attempted so far */
    onImportProgress: (progress: number) => void;
}): ThunkAction<
    Promise<ImportUsersResult>,
    KtState & MembersState & OrganizationState & OrganizationKeyState & AddressesState,
    ProtonThunkArguments,
    UnknownAction
> => {
    return async (dispatch, _, extra) => {
        const [organization, organizationKey, addresses] = await Promise.all([
            dispatch(organizationThunk()),
            dispatch(organizationKeyThunk()),
            dispatch(addressesThunk()),
        ]);

        const error = validateAddUser({
            privateUser: selectedUsers.length > 0 && selectedUsers.every((user) => user.privateSubUser),
            organization,
            organizationKeyInfo: getOrganizationKeyInfo(organization, organizationKey, addresses),
            verifiedDomains,
            ...validationOptions,
        });
        if (error) {
            return { type: 'validation-error', error };
        }

        if (!skipCapacityValidation) {
            try {
                validateOrganizationCapacity(selectedUsers, organization);
            } catch (error: any) {
                if (error instanceof OrganizationCapacityError) {
                    return { type: 'capacity-error', error };
                }
            }
        }

        onImportStart();

        const state: ImportUsersState = {
            successfullyCreatedUsers: [],
            failedUsers: [],
            invalidAddresses: [],
            invalidInvitationAddresses: [],
            unavailableAddresses: [],
            orphanedAddresses: [],
        };
        let cancelled = false;

        extra.eventManager.stop();

        const silentApi = getSilentApiWithAbort(extra.api, signal);

        for (let i = 0; i < selectedUsers.length; i++) {
            if (signal.aborted) {
                break;
            }

            const user = selectedUsers[i];
            const addresses = user.emailAddresses.map((emailAddress) => {
                const [Local, Domain] = getEmailParts(emailAddress);
                return {
                    Local,
                    Domain,
                };
            });
            try {
                await dispatch(
                    createMember({
                        api: silentApi,
                        single: false,
                        member: {
                            mode,
                            name: user.displayName,
                            private: user.privateSubUser ? MEMBER_PRIVATE.UNREADABLE : MEMBER_PRIVATE.READABLE,
                            password: user.password,
                            addresses,
                            storage: Math.round(user.totalStorage),
                            invitationEmail: user.invitationEmail || '',
                            role: MEMBER_ROLE.ORGANIZATION_MEMBER,
                            numAI: false,
                            lumo: false,
                            vpn: user.vpnAccess,
                        },
                        verifiedDomains,
                        validationOptions,
                    })
                );

                state.successfullyCreatedUsers.push(user);
            } catch (error: any) {
                if (getIsOfflineError(error)) {
                    const unattemptedUsers = selectedUsers.slice(i);
                    state.failedUsers.push(...unattemptedUsers);
                    break;
                } else if (error.cancel) {
                    /**
                     * Handle auth prompt cancel
                     */
                    cancelled = true;
                    break;
                } else if (error instanceof InvalidAddressesError) {
                    state.invalidAddresses.push(...error.invalidAddresses);
                    state.invalidInvitationAddresses.push(...error.invalidInvitationAddresses);
                    state.orphanedAddresses.push(...error.orphanedAddresses);
                } else if (error instanceof UnavailableAddressesError) {
                    state.unavailableAddresses.push(...error.unavailableAddresses.map(({ address }) => address));
                    state.orphanedAddresses.push(...error.orphanedAddresses);
                } else {
                    state.failedUsers.push(user);
                    state.orphanedAddresses.push(...user.emailAddresses);
                }
            }

            onImportProgress(i + 1);
        }

        extra.eventManager.start();

        if (state.successfullyCreatedUsers.length) {
            /**
             * Creating members also has an effect on the organization values, so they need to be updated too.
             */
            await Promise.all([
                dispatch(membersThunk({ cache: CacheType.None })),
                dispatch(organizationThunk({ cache: CacheType.None })),
            ]).catch(noop);
        }

        if (signal.aborted) {
            return { type: 'aborted' };
        }

        if (cancelled) {
            return { type: 'cancelled' };
        }

        return { type: 'done', state };
    };
};
