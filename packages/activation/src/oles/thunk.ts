import { createAsyncThunk } from '@reduxjs/toolkit';
import { c } from 'ttag';

import { type AddressKeysState, addressKeysThunk } from '@proton/account/addressKeys';
import type { useGetAddressKeys } from '@proton/account/addressKeys/hooks';
import { createAddress } from '@proton/account/addresses/actions';
import type { KtState } from '@proton/account/kt';
import { UnavailableAddressesError, getMemberAddresses, membersThunk } from '@proton/account/members';
import { createMember } from '@proton/account/members/actions';
import { decryptTemporaryPassword, encryptTemporaryPassword } from '@proton/account/orgJoiningLink/helpers';
import { organizationThunk } from '@proton/account/organization';
import { type OrganizationKeyState, organizationKeyThunk } from '@proton/account/organizationKey';
import type { ProtonDomainsState } from '@proton/account/protonDomains';
import type { UserInvitationsState } from '@proton/account/userInvitations';
import type { UserSettingsState } from '@proton/account/userSettings';
import { type CalendarsState, calendarsThunk } from '@proton/calendar/calendars';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { CacheType } from '@proton/redux-utilities/interface';
import { createCalendar, updateCalendarUserSettings } from '@proton/shared/lib/api/calendars';
import { getUIDApi } from '@proton/shared/lib/api/helpers/customConfig';
import { authMember, updateQuota } from '@proton/shared/lib/api/members';
import { getUser } from '@proton/shared/lib/authentication/getUser';
import { getIsOwnedCalendar } from '@proton/shared/lib/calendar/calendar';
import { DEFAULT_CALENDAR } from '@proton/shared/lib/calendar/constants';
import { setupCalendarKey } from '@proton/shared/lib/calendar/crypto/keys/setupCalendarKeys';
import { MEMBER_PRIVATE, MEMBER_ROLE } from '@proton/shared/lib/constants';
import { getEmailParts } from '@proton/shared/lib/helpers/email';
import {
    type Address,
    type Api,
    CreateMemberMode,
    type Domain,
    type KeyPair,
    type Member,
} from '@proton/shared/lib/interfaces';
import type { Calendar } from '@proton/shared/lib/interfaces/calendar/Calendar';
import { getDecryptedAddressKeys } from '@proton/shared/lib/keys/getDecryptedAddressKeys';
import { getDecryptedUserKeys } from '@proton/shared/lib/keys/getDecryptedUserKeys';
import getRandomString from '@proton/utils/getRandomString';
import isTruthy from '@proton/utils/isTruthy';
import noop from '@proton/utils/noop';

import { createJoiningLink, createOrganizationImporter, createOrganizationImporterMigration } from '../api';
import {
    ApiImportProvider,
    type ApiImporterOrganization,
    type ApiImporterOrganizationUser,
    type ApiJoiningLinkData,
} from '../api/api.interface';
import type { OAuthToken } from '../logic/oauthToken';
import type { JoiningLink, MigrationConfiguration } from './types';

type RequiredState = KtState &
    OrganizationKeyState &
    ProtonDomainsState &
    UserSettingsState &
    UserInvitationsState &
    CalendarsState &
    AddressKeysState;

type ThunkApi<T> = { state: T; extra: ProtonThunkArguments };

const createDefaultCalendar = async (
    uidApi: Api,
    getAddressKeys: ReturnType<typeof useGetAddressKeys>,
    addressID: string
) => {
    const { Calendar } = await uidApi<{ Calendar: Calendar }>(
        createCalendar({
            Name: DEFAULT_CALENDAR.name,
            Description: DEFAULT_CALENDAR.description,
            Color: DEFAULT_CALENDAR.color,
            AddressID: addressID,
            Display: 1,
            IsImport: 1,
        })
    );

    await setupCalendarKey({ api: uidApi, calendarID: Calendar.ID, addressID, getAddressKeys });

    await uidApi(updateCalendarUserSettings({ DefaultCalendarID: Calendar.ID }));

    return Calendar;
};

const getMemberApi = async (api: Api, member: Member) => {
    const { UID } = await api<{ UID: string; LocalID: number }>(authMember(member.ID));
    return getUIDApi(UID, api);
};

const getMemberAddressKeys = async (memberApi: Api, address: Address, orgKey: KeyPair) => {
    const apiUser = await getUser(memberApi);
    const userKeys = await getDecryptedUserKeys(apiUser.Keys, '', orgKey);
    return getDecryptedAddressKeys(address.Keys, userKeys, '', orgKey);
};

type CreateMigrationBatchParams = {
    importerOrganizationId: string;
    providerUsers: ApiImporterOrganizationUser[];
    selectedUsers: string[];
    oauthToken: OAuthToken;
    domain: Domain;
    password: string;
};

export const parseJoiningLinkData = createAsyncThunk<JoiningLink, ApiJoiningLinkData, ThunkApi<OrganizationKeyState>>(
    'oles/parseJoiningLinkData',
    async (joiningLinkData, { dispatch }) => {
        const orgKey = await dispatch(organizationKeyThunk());
        if (!orgKey.publicKey) {
            throw new Error('Missing organization public key');
        }
        return {
            token: joiningLinkData.Token,
            password: await decryptTemporaryPassword(joiningLinkData.EncryptedTempPassword, orgKey.privateKey),
            expirationTime: joiningLinkData.TokenExpirationTime,
        };
    }
);

export const setupJoiningLink = createAsyncThunk<JoiningLink, string, ThunkApi<OrganizationKeyState>>(
    'oles/setupJoiningLink',
    async (importerOganizationId, { dispatch, extra: { api } }) => {
        const orgKey = await dispatch(organizationKeyThunk());
        if (!orgKey.publicKey) {
            throw new Error('Missing organization public key');
        }
        const password = getRandomString(24);
        const EncryptedTempPassword = await encryptTemporaryPassword(password, orgKey.publicKey);
        const { JoiningLinkData } = await api<{ JoiningLinkData: ApiJoiningLinkData }>(
            createJoiningLink(importerOganizationId, {
                EncryptedTempPassword,
            })
        );
        return {
            token: JoiningLinkData.Token,
            expirationTime: JoiningLinkData.TokenExpirationTime,
            password,
        };
    }
);

export const setupMigration = createAsyncThunk<
    MigrationConfiguration,
    MigrationConfiguration,
    ThunkApi<OrganizationKeyState>
>('oles/setupMigration', async (payload, { dispatch, extra: { api } }) => {
    const { ImporterOrganizationID, DomainName, State } = await api<ApiImporterOrganization>(
        createOrganizationImporter({
            Provider: ApiImportProvider.GOOGLE,
            Products: payload.selectedProducts,
            ImportOrganizationSettings: payload.importOrganizationSettings,
        })
    );

    const joiningLink = await dispatch(setupJoiningLink(ImporterOrganizationID)).unwrap();

    return {
        selectedProducts: payload.selectedProducts,
        notifyList: payload.notifyList,
        timePeriod: payload.timePeriod,
        domainName: DomainName,
        importerOrganizationId: ImporterOrganizationID,
        importOrganizationSettings: payload.importOrganizationSettings,
        joiningLink,
        state: State,
    };
});

export type CreateMigrationBatchError = {
    metadata: { user: ApiImporterOrganizationUser };
    error: { code?: any; name?: string; message?: string };
};

const toSerializableUserError = (user: ApiImporterOrganizationUser, err: any): CreateMigrationBatchError => {
    const error = (() => {
        if (err instanceof UnavailableAddressesError) {
            return {
                code: 2500,
                name: 'UnavailableAddressesError',
                message: c('BOSS')
                    .t`Address is already used by a user outside of your organization. Please contact customer support to resolve this`,
            };
        }

        return {
            code: err?.Code || err?.code,
            name: err?.Name || err?.name,
            message: err?.Message || err?.message,
        };
    })();

    return {
        metadata: { user },
        error,
    };
};

type CreateMigrationBatchResult = {
    errors: CreateMigrationBatchError[];
    results: Address[];
};

export const createMigrationBatch = createAsyncThunk<
    CreateMigrationBatchResult,
    CreateMigrationBatchParams,
    ThunkApi<RequiredState>
>(
    'oles/createMigrationBatch',
    async (
        { importerOrganizationId, domain, providerUsers, selectedUsers, oauthToken, password },
        { dispatch, extra }
    ) => {
        const errors: CreateMigrationBatchResult['errors'] = [];
        const api = <T>(config: any) =>
            extra.api<T>({
                ...config,
                data: config.data ? { ...config.data, PersistPasswordScope: true } : undefined,
                silence: true,
            });

        const [organization, members, orgKey] = await Promise.all([
            dispatch(organizationThunk()),
            dispatch(membersThunk()),
            dispatch(organizationKeyThunk()),
        ]);

        if (!orgKey.privateKey) {
            throw new Error(c('BOSS').t`Missing organization private key`);
        }

        if (!orgKey.publicKey) {
            throw new Error(c('BOSS').t`Missing organization public key`);
        }

        const membersAddresses: Record<string, Address[]> = {};
        for (const member of members) {
            const addresses = await dispatch(getMemberAddresses({ member, cache: CacheType.None }));
            membersAddresses[member.ID] = addresses;
        }

        const getKnownAddresses = () => Object.values(membersAddresses).flat();
        const isSelf = (email: string) => email === oauthToken.Account;
        const isKnownAddress = (email: string) => getKnownAddresses().find((a) => a.Email === email);
        const isExistingUser = (email: string) => isSelf(email) || isKnownAddress(email);

        const users = providerUsers.filter((u) => selectedUsers.includes(u.ID));
        const usersToCreate = users.filter((u) => !isSelf(u.Email) && !isKnownAddress(u.Email));
        const existingUsers = providerUsers.filter((u) => isExistingUser(u.Email));

        const availableSeats = organization.MaxMembers - organization.UsedMembers;
        if (usersToCreate.length > availableSeats) {
            throw { name: 'SeatsError', message: c('BOSS').t`Organization does not have enough seats available` };
        }

        const selfMember = members.find((m) => m.Self)!;
        let allocatableStorage = organization.MaxSpace - organization.AssignedSpace;

        // Drop some quota from the admin if safe to do so
        if (selfMember.MaxSpace === organization.MaxSpace && organization.MaxMembers > 1 && usersToCreate.length) {
            const newQuota = Math.floor(organization.MaxSpace / organization.MaxMembers);
            await api(updateQuota(selfMember.ID, newQuota));
            allocatableStorage = organization.MaxSpace - newQuota;
        }

        const userQuota = Math.floor(allocatableStorage / (providerUsers.length - existingUsers.length));
        const totalStorageRequired = usersToCreate.length * userQuota;
        if ((usersToCreate.length > 1 && userQuota < 1) || totalStorageRequired > allocatableStorage) {
            throw { name: 'QuotaError', message: c('BOSS').t`Organization does not have enough storage available` };
        }

        const migratingSelf = users.find((u) => isSelf(u.Email));
        if (migratingSelf) {
            try {
                const selfMember = members.find((m) => !!m.Self)!;

                let selfAddress = membersAddresses[selfMember.ID].find((a) => isSelf(a.Email));
                if (!selfAddress) {
                    const [Local, Domain] = getEmailParts(oauthToken.Account);
                    const address = await dispatch(
                        createAddress({
                            member: selfMember,
                            setDefault: true,
                            emailAddressParts: {
                                Local,
                                Domain,
                            },
                        })
                    );
                    selfAddress = address;
                    membersAddresses[selfMember.ID] = [address];
                }

                const calendars = (await dispatch(calendarsThunk())).filter(
                    (calendar) => getIsOwnedCalendar(calendar) && calendar.Owner.Email === oauthToken.Account
                );

                if (!calendars.length) {
                    const getAddressKeys = (addressID: string) => dispatch(addressKeysThunk({ addressID }));
                    await createDefaultCalendar(api, getAddressKeys, selfAddress.ID);
                }
            } catch (err: any) {
                errors.push(toSerializableUserError(migratingSelf, err));
            }
        }

        for (const user of usersToCreate) {
            try {
                const [Local, Domain] = getEmailParts(user.Email);
                const member = await dispatch(
                    createMember({
                        api,
                        single: false,
                        member: {
                            name: user.AdminSetName,
                            addresses: [
                                {
                                    Domain,
                                    Local,
                                },
                            ],
                            invitationEmail: '',
                            private: MEMBER_PRIVATE.READABLE,
                            password,
                            role: MEMBER_ROLE.ORGANIZATION_MEMBER,
                            numAI: false,
                            lumo: false,
                            storage: userQuota,
                            mode: CreateMemberMode.LoginLink,
                        },
                        verifiedDomains: [domain],
                        // Disabled because we're doing bulk member creation,
                        // and will handle these errors on an entire-migration basis
                        validationOptions: {
                            disableAddressValidation: true,
                            disableDomainValidation: true,
                            disableStorageValidation: true,
                        },
                    })
                );

                // Allow a bit of time for addresses to catch up
                await new Promise((resolve) => setTimeout(resolve, 250));

                const [address] = await dispatch(getMemberAddresses({ member, cache: CacheType.None }));
                if (!address) {
                    throw new Error(
                        c('BOSS').t`Member address not found. Please contact customer support to resolve this`
                    );
                }
                membersAddresses[member.ID] = [address];

                const memberApi = await getMemberApi(api, member);
                const getAddressKeys = () =>
                    getMemberAddressKeys(memberApi, address, {
                        publicKey: orgKey.publicKey,
                        privateKey: orgKey.privateKey,
                    });
                await createDefaultCalendar(memberApi, getAddressKeys, address.ID);
            } catch (err: any) {
                errors.push(toSerializableUserError(user, err));
            }
        }

        if (usersToCreate.length) {
            // Creating users affects organization storage and members, so they need to be refetched
            void Promise.all([
                dispatch(organizationThunk({ cache: CacheType.None })).catch(noop),
                dispatch(membersThunk({ cache: CacheType.None })).catch(noop),
            ]);
        }

        const addressesToMigrate = (() => {
            const knownAddresses = getKnownAddresses();
            return users.map((u) => knownAddresses.find((a) => a.Email === u.Email)).filter(isTruthy);
        })();

        if (addressesToMigrate.length) {
            await api(
                createOrganizationImporterMigration({
                    ImporterOrganizationId: importerOrganizationId,
                    AddressIds: addressesToMigrate.map((a) => a.ID),
                })
            );
        }

        return {
            errors,
            results: addressesToMigrate,
        };
    }
);
