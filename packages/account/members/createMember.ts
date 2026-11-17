import type { ThunkAction, UnknownAction } from '@reduxjs/toolkit';
import { c } from 'ttag';

import { createKTVerifier } from '@proton/key-transparency/helpers/createKTVerifier';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types/interface';
import { CacheType } from '@proton/redux-utilities/interface';
import { getApiError } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import {
    checkMemberAddressAvailability,
    createMemberAddress,
    createMember as createMemberConfig,
} from '@proton/shared/lib/api/members';
import {
    DEFAULT_KEYGEN_TYPE,
    HTTP_STATUS_CODE,
    KEYGEN_CONFIGS,
    MEMBER_PRIVATE,
    MEMBER_ROLE,
    VPN_CONNECTIONS,
} from '@proton/shared/lib/constants';
import { validateEmailAddress } from '@proton/shared/lib/helpers/email';
import type { Address } from '@proton/shared/lib/interfaces/Address';
import type { Api } from '@proton/shared/lib/interfaces/Api';
import type { Domain } from '@proton/shared/lib/interfaces/Domain';
import type { DecryptedKey } from '@proton/shared/lib/interfaces/Key';
import type { Member } from '@proton/shared/lib/interfaces/Member';
import { CreateMemberMode } from '@proton/shared/lib/interfaces/Member';
import type { Organization } from '@proton/shared/lib/interfaces/Organization';
import type { CachedOrganizationKey } from '@proton/shared/lib/interfaces/OrganizationKey';
import type { User } from '@proton/shared/lib/interfaces/User';
import { setupMemberKeys } from '@proton/shared/lib/keys/memberKeys';
import { getIsPasswordless } from '@proton/shared/lib/keys/organizationKeys';
import { getOrganizationKeyInfo } from '@proton/shared/lib/organization/helper';
import { srpVerify } from '@proton/shared/lib/srp';
import noop from '@proton/utils/noop';

import { addressesThunk } from '../addresses';
import type { KtState } from '../kt';
import { getKTActivation, getKTUserContext } from '../kt/actions';
import { organizationThunk } from '../organization';
import { type OrganizationKeyState, organizationKeyThunk } from '../organizationKey';
import { getMemberKeyPayload, getPrivateAdminError } from '../organizationKey/actions';
import { type OrganizationRolesState, organizationRolesThunk } from '../organizationRoles';
import { isOrgKeyRequired, isOwnerRoleSyncEnabled } from '../organizationRoles/helpers';
import { userThunk } from '../user';
import { userKeysThunk } from '../userKeys';
import { assignMemberRoles, resetSelfVpnConnectionsHelper, setRole } from './actions';
import InvalidAddressesError from './errors/InvalidAddressesError';
import MemberCreationValidationError from './errors/MemberCreationValidationError';
import UnavailableAddressesError from './errors/UnavailableAddressesError';
import { getMember } from './getMember';
import { type MembersState, membersThunk, upsertMember } from './index';
import { getInvitationData, getSignedInvitationData } from './unprivatization';
import { getRequiredOwnerRoleId, updateOwnerRole } from './updateOwnerRole';
import validateAddUser from './validateAddUser';

export interface CreateMemberPayload {
    name: string;
    addresses: { Local: string; Domain: string }[];
    invitationEmail: string;
    mode: CreateMemberMode;
    private: MEMBER_PRIVATE | null;
    storage: number;
    vpn?: boolean;
    password: string;
    role: MEMBER_ROLE | null;
    numAI: boolean;
    lumo: boolean;
}

const createAddressesForMember = async ({
    api,
    addresses,
    member,
}: {
    member: Member;
    api: Api;
    addresses: { Local: string; Domain: string; DisableE2EE?: boolean }[];
}) => {
    const memberAddresses: Address[] = [];
    for (const { Local, Domain, DisableE2EE } of addresses) {
        const { Address } = await api<{ Address: Address }>(
            createMemberAddress(member.ID, {
                Local,
                Domain,
                DisableE2EE,
            })
        );
        memberAddresses.push(Address);
    }
    return memberAddresses;
};

type MemberCreationThunk<T> = ThunkAction<
    Promise<T>,
    KtState & OrganizationKeyState & MembersState & OrganizationRolesState,
    ProtonThunkArguments,
    UnknownAction
>;

interface CreateMemberValidationOptions {
    disableStorageValidation?: boolean;
    disableDomainValidation?: boolean;
    disableAddressValidation?: boolean;
}

/** In an invitation, the selected roles decide the role, and it can only be admin in a passwordless organization */
const getNewMemberRole = ({
    model,
    hasRoles,
    getsOrgKeyRole,
    organizationKey,
}: {
    model: CreateMemberPayload;
    hasRoles: boolean;
    getsOrgKeyRole: boolean;
    organizationKey: CachedOrganizationKey;
}): MEMBER_ROLE | null => {
    if (model.mode !== CreateMemberMode.Invitation) {
        return model.role;
    }
    // The API finishes an admin invitation with an org key activation, which only passwordless organizations have
    if (!getIsPasswordless(organizationKey?.Key)) {
        return MEMBER_ROLE.ORGANIZATION_MEMBER;
    }
    if (!hasRoles) {
        return model.role;
    }
    return getsOrgKeyRole ? MEMBER_ROLE.ORGANIZATION_ADMIN : MEMBER_ROLE.ORGANIZATION_MEMBER;
};

const assertCanCreateMember = ({
    model,
    getsOrgKeyRole,
    organization,
    organizationKey,
    ownerAddresses,
    verifiedDomains,
    validationOptions,
}: {
    model: CreateMemberPayload;
    getsOrgKeyRole: boolean;
    organization: Organization;
    organizationKey: CachedOrganizationKey;
    ownerAddresses: Address[];
    verifiedDomains: Domain[];
    validationOptions: CreateMemberValidationOptions;
}) => {
    const error = validateAddUser({
        privateUser: model.private === MEMBER_PRIVATE.UNREADABLE,
        organization,
        organizationKeyInfo: getOrganizationKeyInfo(organization, organizationKey, ownerAddresses),
        verifiedDomains,
        ...validationOptions,
    });
    if (error) {
        throw new MemberCreationValidationError(error);
    }

    const addresses = model.addresses.map(({ Local, Domain }) => `${Local}@${Domain}`);
    const invalidAddresses = addresses.filter((address) => !validateEmailAddress(address));
    const invalidInvitationAddresses =
        model.mode === CreateMemberMode.Invitation && !validateEmailAddress(model.invitationEmail)
            ? [model.invitationEmail]
            : [];
    if (invalidAddresses.length || invalidInvitationAddresses.length) {
        const validAddresses = addresses.filter((address) => validateEmailAddress(address));
        throw new InvalidAddressesError(invalidAddresses, invalidInvitationAddresses, validAddresses);
    }

    if (model.mode === CreateMemberMode.Password && !model.private && !organizationKey?.privateKey) {
        throw new MemberCreationValidationError(
            c('Error').t`Organization key must be activated to create non-private users`
        );
    }
    if (
        model.private &&
        (model.role === MEMBER_ROLE.ORGANIZATION_ADMIN || getsOrgKeyRole) &&
        getIsPasswordless(organizationKey?.Key)
    ) {
        throw new MemberCreationValidationError(getPrivateAdminError());
    }
    if (model.mode === CreateMemberMode.Invitation && !organizationKey?.privateKey) {
        throw new MemberCreationValidationError(
            c('Error').t`Organization key must be activated to create invited users`
        );
    }
};

const assertAddressesAvailable = async (api: Api, addresses: CreateMemberPayload['addresses']) => {
    const unavailableAddresses: { message: string; address: string }[] = [];
    const availableAddresses: string[] = [];

    const checkAddress = async ({ Local, Domain }: { Local: string; Domain: string }) => {
        const address = `${Local}@${Domain}`;
        try {
            await api(checkMemberAddressAvailability({ Local, Domain }));
            availableAddresses.push(address);
        } catch (error) {
            const { status, message } = getApiError(error);
            if (status !== HTTP_STATUS_CODE.CONFLICT) {
                throw error;
            }
            unavailableAddresses.push({ message, address });
        }
    };

    // The first check can prompt for the password, so the others wait for it
    const [firstAddress, ...otherAddresses] = addresses;
    await checkAddress(firstAddress);
    await Promise.all(otherAddresses.map(checkAddress));

    if (unavailableAddresses.length) {
        throw new UnavailableAddressesError(unavailableAddresses, availableAddresses);
    }
};

const getNewMemberData = (model: CreateMemberPayload) => ({
    Name: model.name || model.addresses[0].Local,
    MaxSpace: +model.storage,
    MaxVPN: model.vpn ? VPN_CONNECTIONS : 0,
    MaxAI: model.numAI ? 1 : 0,
    MaxLumo: model.lumo ? 1 : 0,
    TemporaryPassword: model.mode === CreateMemberMode.LoginLink,
});

const createInvitedMember = ({
    model,
    admin,
    api,
}: {
    model: CreateMemberPayload;
    admin: boolean;
    api: Api;
}): MemberCreationThunk<Member> => {
    return async (dispatch) => {
        const organizationKey = await dispatch(organizationKeyThunk()); // Ensure latest key
        if (!organizationKey?.privateKey) {
            throw new MemberCreationValidationError(
                c('Error').t`Organization key must be activated to create invited users`
            );
        }
        const [{ Local, Domain }] = model.addresses;
        const invitationData = await getInvitationData({
            api,
            address: `${Local}@${Domain}`,
            expectRevisionChange: true,
            admin: admin ? true : undefined,
        });
        const invitationSignature = await getSignedInvitationData(organizationKey.privateKey, invitationData);
        const { Member } = await api<{ Member: Member }>(
            createMemberConfig({
                ...getNewMemberData(model),
                Invitation: {
                    Email: model.invitationEmail,
                    Data: invitationData,
                    Signature: invitationSignature,
                    PrivateIntent: model.private === MEMBER_PRIVATE.UNREADABLE,
                },
            })
        );
        if (model.private) {
            await createAddressesForMember({ api, member: Member, addresses: model.addresses });
        }
        return Member;
    };
};

/** A member that can sign in right away, with a password or a login link. Private members get no keys */
const createMemberAccount = ({
    model,
    api,
    user,
    userKeys,
    ownerAddresses,
}: {
    model: CreateMemberPayload;
    api: Api;
    user: User;
    userKeys: DecryptedKey[];
    ownerAddresses: Address[];
}): MemberCreationThunk<{ member: Member; memberWithKeys?: Member; memberAddresses: Address[] }> => {
    return async (dispatch, _, extra) => {
        const memberConfig = createMemberConfig({
            ...getNewMemberData(model),
            Private: +(model.private === MEMBER_PRIVATE.UNREADABLE),
        });
        const { Member } =
            model.mode === CreateMemberMode.LoginLink
                ? await api<{ Member: Member }>(memberConfig)
                : await srpVerify<{ Member: Member }>({
                      api,
                      credentials: { password: model.password },
                      config: memberConfig,
                  });
        const memberAddresses = await createAddressesForMember({ api, member: Member, addresses: model.addresses });

        const organizationKey = await dispatch(organizationKeyThunk()); // Ensure latest key
        if (model.private || !organizationKey?.privateKey) {
            return { member: Member, memberAddresses };
        }
        const { keyTransparencyVerify, keyTransparencyCommit } = createKTVerifier({
            config: extra.config,
            api,
            ktActivation: dispatch(getKTActivation()),
        });
        const { Member: memberWithKeys } = await setupMemberKeys({
            api,
            ownerAddresses,
            member: Member,
            memberAddresses,
            organizationKey: organizationKey.privateKey,
            keyGenConfig: KEYGEN_CONFIGS[DEFAULT_KEYGEN_TYPE],
            password: model.password,
            keyTransparencyVerify,
            skipSrp: model.mode === CreateMemberMode.LoginLink,
        });
        await keyTransparencyCommit(user, userKeys);
        return { member: Member, memberWithKeys, memberAddresses };
    };
};

/** An admin created with a password is promoted right away, while an invited one is promoted once they accept */
const promoteNewMemberToAdmin = ({
    member,
    memberWithKeys,
    memberAddresses,
    api,
}: {
    member: Member;
    memberWithKeys?: Member;
    memberAddresses: Address[];
    api: Api;
}): MemberCreationThunk<void> => {
    return async (dispatch) => {
        const organizationKey = await dispatch(organizationKeyThunk()); // Ensure latest key
        const isPasswordless = getIsPasswordless(organizationKey?.Key);
        // In passwordless organizations, members without keys (private ones) can't be made admins on creation
        if (isPasswordless && !memberWithKeys) {
            return;
        }
        const payload =
            isPasswordless && memberWithKeys
                ? await getMemberKeyPayload({
                      organizationKey,
                      member: memberWithKeys,
                      memberAddresses,
                      mode: { type: 'email', ktUserContext: await dispatch(getKTUserContext()) },
                      api,
                  })
                : null;
        await dispatch(setRole({ member, payload, api, role: MEMBER_ROLE.ORGANIZATION_ADMIN, syncOwner: true }));
    };
};

const assignNewMemberRoles = ({
    member,
    roleIds,
    isAdminInvitation,
    api,
}: {
    member: Member;
    roleIds: Set<string> | undefined;
    isAdminInvitation: boolean;
    api: Api;
}): MemberCreationThunk<void> => {
    return async (dispatch) => {
        if (roleIds?.size) {
            await dispatch(
                assignMemberRoles({ member, currentRoles: [], desiredRoleIds: roleIds, payload: null, api })
            );
        } else if (isAdminInvitation) {
            // The API only finishes an admin invitation if the member holds a role giving org key access
            await dispatch(updateOwnerRole({ member, makeAdmin: true, api }));
        }
    };
};

export const createMember = ({
    member: originalModel,
    single,
    verifiedDomains,
    api,
    validationOptions,
    roleIds,
}: {
    member: CreateMemberPayload;
    single: boolean;
    verifiedDomains: Domain[] /* Remove dependency, move to thunk */;
    validationOptions: CreateMemberValidationOptions;
    api: Api;
    /** Roles assigned once the member exists. In an invitation, a role needing the org key makes it an admin one */
    roleIds?: Set<string>;
}): MemberCreationThunk<{ member: Member; rolesError?: unknown }> => {
    return async (dispatch, _, extra) => {
        const [user, userKeys, ownerAddresses, organizationKey, organization, members] = await Promise.all([
            dispatch(userThunk()),
            dispatch(userKeysThunk()),
            dispatch(addressesThunk()),
            dispatch(organizationKeyThunk()),
            dispatch(organizationThunk()),
            dispatch(membersThunk()),
        ]);
        const organizationRoles = roleIds?.size ? await dispatch(organizationRolesThunk()) : [];
        const getsOrgKeyRole = organizationRoles.some(
            (role) => roleIds?.has(role.OrganizationRoleID) && isOrgKeyRequired(role)
        );
        const model = {
            ...originalModel,
            role: getNewMemberRole({
                model: originalModel,
                hasRoles: Boolean(roleIds?.size),
                getsOrgKeyRole,
                organizationKey,
            }),
        };
        const isAdmin = model.role === MEMBER_ROLE.ORGANIZATION_ADMIN;

        if (model.vpn) {
            await resetSelfVpnConnectionsHelper({ api, members, organization }).catch(noop);
        }
        assertCanCreateMember({
            model,
            getsOrgKeyRole,
            organization,
            organizationKey,
            ownerAddresses,
            verifiedDomains,
            validationOptions,
        });
        await assertAddressesAvailable(api, model.addresses);
        if (isAdmin && isOwnerRoleSyncEnabled(extra.unleashClient)) {
            await dispatch(getRequiredOwnerRoleId());
        }

        // A failed role step doesn't undo the creation, so it's returned as `rolesError` instead of thrown
        let rolesError: unknown;
        const keepRolesError = (error: unknown) => {
            rolesError = error;
        };

        let createdMember: Member;
        if (model.mode === CreateMemberMode.Invitation) {
            createdMember = await dispatch(createInvitedMember({ model, admin: isAdmin, api }));
        } else {
            const account = await dispatch(createMemberAccount({ model, api, user, userKeys, ownerAddresses }));
            createdMember = account.member;
            // Before the fetch below, so that the member it stores is already an admin
            if (isAdmin) {
                await dispatch(promoteNewMemberToAdmin({ ...account, api })).catch(keepRolesError);
            }
        }

        const [member] = await Promise.all([
            getMember(api, createdMember.ID),
            // Upserting the member also has an effect on the org values, so they need to be updated too.
            single ? dispatch(organizationThunk({ cache: CacheType.None })) : undefined,
        ]);
        dispatch(upsertMember({ member }));

        // After the fetch: an invited member's roles rely on its pending invitation, which the fetched member has
        const isAdminInvitation = isAdmin && model.mode === CreateMemberMode.Invitation;
        await dispatch(assignNewMemberRoles({ member, roleIds, isAdminInvitation, api })).catch(keepRolesError);

        return { member, rolesError };
    };
};
