import { createAsyncThunk } from '@reduxjs/toolkit';
import { c } from 'ttag';

import { type AddressKeysState, addressKeysThunk } from '@proton/account/addressKeys';
import type { useGetAddressKeys } from '@proton/account/addressKeys/hooks';
import { createAddress } from '@proton/account/addresses/actions';
import type { KtState } from '@proton/account/kt';
import { getMemberAddresses, membersThunk } from '@proton/account/members';
import { createMember } from '@proton/account/members/actions';
import { organizationThunk } from '@proton/account/organization';
import { type OrganizationKeyState, organizationKeyThunk } from '@proton/account/organizationKey';
import type { ProtonDomainsState } from '@proton/account/protonDomains';
import type { UserInvitationsState } from '@proton/account/userInvitations';
import type { UserSettingsState } from '@proton/account/userSettings';
import { type CalendarsState, calendarsThunk } from '@proton/calendar/calendars';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { createCalendar, updateCalendarUserSettings } from '@proton/shared/lib/api/calendars';
import { getSilentApi, getUIDApi } from '@proton/shared/lib/api/helpers/customConfig';
import { authMember } from '@proton/shared/lib/api/members';
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
import isTruthy from '@proton/utils/isTruthy';

import { createOrganizationImporterMigration } from '../api';
import type { ApiImporterOrganizationUser } from '../api/api.interface';
import type { OAuthToken } from '../logic/oauthToken';

type RequiredState = KtState &
    OrganizationKeyState &
    ProtonDomainsState &
    UserSettingsState &
    UserInvitationsState &
    CalendarsState &
    AddressKeysState;

type ThunkApi = { state: RequiredState; extra: ProtonThunkArguments };

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
    const silentApi = getSilentApi(api);
    const { UID } = await silentApi<{ UID: string; LocalID: number }>(
        authMember(member.ID, { PersistPasswordScope: true } as {})
    );
    return getUIDApi(UID, silentApi);
};

const getMemberAddressKeys = async (memberApi: Api, address: Address, orgKey: KeyPair) => {
    const apiUser = await getUser(memberApi);
    const userKeys = await getDecryptedUserKeys(apiUser.Keys, '', orgKey);
    return getDecryptedAddressKeys(address.Keys, userKeys, '', orgKey);
};

type CreateMigrationBatchParams = {
    importerOrganizationId: string;
    users: ApiImporterOrganizationUser[];
    oauthToken: OAuthToken;
    domain: Domain;
};

export const createMigrationBatch = createAsyncThunk<void, CreateMigrationBatchParams, ThunkApi>(
    'oles/createMigration',
    async ({ importerOrganizationId, domain, users, oauthToken }, { dispatch, extra: { api } }) => {
        const [organization, members, orgKey] = await Promise.all([
            dispatch(organizationThunk()),
            dispatch(membersThunk()),
            dispatch(organizationKeyThunk()),
        ]);

        if (!orgKey.privateKey) {
            throw new Error('Missing organization private key');
        }

        const membersAddresses: Record<string, Address[]> = {};
        for (const member of members) {
            const addresses = await dispatch(getMemberAddresses({ member, retry: true }));
            membersAddresses[member.ID] = addresses;
        }

        const getKnownAddresses = () => Object.values(membersAddresses).flat();
        const isSelf = (email: string) => email === oauthToken.Account;
        const isKnownAddress = (email: string) => getKnownAddresses().find((a) => a.Email === email);

        const usersToCreate = users.filter((u) => !isSelf(u.Email) && !isKnownAddress(u.Email));

        const availableSeats = organization.MaxMembers - organization.UsedMembers;
        if (usersToCreate.length > availableSeats) {
            throw new Error(c('BOSS').t`Organization does not have enough seats available`);
        }

        const migratingSelf = users.find((u) => isSelf(u.Email));
        if (migratingSelf) {
            const selfMember = members.find((m) => !!m.Self)!;

            if (!membersAddresses[selfMember.ID].find((a) => isSelf(a.Email))) {
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
                membersAddresses[selfMember.ID] = [address];
            }

            const calendars = (await dispatch(calendarsThunk())).filter(
                (calendar) => getIsOwnedCalendar(calendar) && calendar.Owner.Email === oauthToken.Account
            );

            if (!calendars.length) {
                const addressID = membersAddresses[selfMember.ID].find((a) => a.Email.endsWith(domain.DomainName))!.ID;
                const getAddressKeys = (addressID: string) => dispatch(addressKeysThunk({ addressID }));
                await createDefaultCalendar(api, getAddressKeys, addressID);
            }
        }

        const allocatableStorage = organization.MaxSpace - organization.AssignedSpace;
        const fairSplitAmount = organization.MaxSpace / organization.MaxMembers;
        const perUserStorage = (u: ApiImporterOrganizationUser) => Math.max(u.UsedQuota, fairSplitAmount);
        const totalStorageRequired = usersToCreate.reduce((acc, u) => acc + perUserStorage(u), 0);
        if (totalStorageRequired > allocatableStorage) {
            throw new Error(c('BOSS').t`Organization does not have enough storage available`);
        }

        for (const user of usersToCreate) {
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
                        invitationEmail: user.Email,
                        private: MEMBER_PRIVATE.READABLE,
                        password: 'random-password',
                        role: MEMBER_ROLE.ORGANIZATION_MEMBER,
                        numAI: false,
                        lumo: false,
                        storage: perUserStorage(user),
                        mode: CreateMemberMode.Password,
                    },
                    verifiedDomains: [domain],
                    validationOptions: {
                        disableAddressValidation: false,
                        disableDomainValidation: false,
                        disableStorageValidation: false,
                    },
                })
            );

            const addresses = await dispatch(getMemberAddresses({ member }));
            membersAddresses[member.ID] = addresses;

            const memberApi = await getMemberApi(api, member);
            const getAddressKeys = () => getMemberAddressKeys(memberApi, addresses[0], orgKey);
            await createDefaultCalendar(memberApi, getAddressKeys, addresses[0].ID);
        }

        const addressesToMigrate = (() => {
            const knownAddresses = getKnownAddresses();
            return users.map((u) => knownAddresses.find((a) => a.Email === u.Email)).filter(isTruthy);
        })();

        await api(
            createOrganizationImporterMigration({
                ImporterOrganizationId: importerOrganizationId,
                AddressIds: addressesToMigrate.map((a) => a.ID),
            })
        );
    }
);
