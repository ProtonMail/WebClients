import { ThunkAction, UnknownAction } from '@reduxjs/toolkit';
import { c } from 'ttag';

import type { ProtonThunkArguments } from '@proton/redux-shared-store';
import {
    checkMemberAddressAvailability,
    createMemberAddress,
    createMember as createMemberConfig,
    privatizeMember,
    updateName,
    updateQuota,
    updateRole,
    updateVPN,
} from '@proton/shared/lib/api/members';
import {
    DEFAULT_ENCRYPTION_CONFIG,
    ENCRYPTION_CONFIGS,
    MEMBER_ROLE,
    VPN_CONNECTIONS,
} from '@proton/shared/lib/constants';
import { validateEmailAddress } from '@proton/shared/lib/helpers/email';
import type {
    Address,
    Api,
    Domain,
    KeyTransparencyCommit,
    KeyTransparencyVerify,
    Member,
    VerifyOutboundPublicKeys,
} from '@proton/shared/lib/interfaces';
import { getIsPasswordless, setupMemberKeys } from '@proton/shared/lib/keys';
import { getOrganizationKeyInfo } from '@proton/shared/lib/organization/helper';
import { srpVerify } from '@proton/shared/lib/srp';
import noop from '@proton/utils/noop';

import { addressesThunk } from '../addresses';
import { organizationThunk } from '../organization';
import { OrganizationKeyState, organizationKeyThunk } from '../organizationKey';
import { MemberKeyPayload, getMemberKeyPayload, getPrivateAdminError, setAdminRoles } from '../organizationKey/actions';
import { userKeysThunk } from '../userKeys';
import { membersThunk } from './index';
import validateAddUser from './validateAddUser';

class ValidationError extends Error {
    public trace = false;
}

export const setAdminRole = ({
    member,
    payload,
    api,
}: {
    member: Member;
    payload: MemberKeyPayload | null;
    api: Api;
}): ThunkAction<Promise<void>, OrganizationKeyState, ProtonThunkArguments, UnknownAction> => {
    return async (dispatch) => {
        const organizationKey = await dispatch(organizationKeyThunk());

        if (!getIsPasswordless(organizationKey?.Key)) {
            await api(updateRole(member.ID, MEMBER_ROLE.ORGANIZATION_ADMIN));
            return;
        }

        if (!payload) {
            throw new Error('Missing payload');
        }

        await dispatch(setAdminRoles({ memberKeyPayloads: [payload], api }));
    };
};

interface CreateMemberPayload {
    name: string;
    address: { Local: string; Domain: string };
    private: boolean;
    storage: number;
    vpn?: boolean;
    password: string;
    role: MEMBER_ROLE | null;
}

export const editMember = ({
    member,
    memberDiff,
    memberKeyPacketPayload,
    api,
}: {
    member: Member;
    memberDiff: Partial<CreateMemberPayload>;
    memberKeyPacketPayload: MemberKeyPayload | null;
    api: Api;
}): ThunkAction<Promise<boolean>, OrganizationKeyState, ProtonThunkArguments, UnknownAction> => {
    return async (dispatch) => {
        if (memberDiff.name !== undefined) {
            await api(updateName(member.ID, memberDiff.name));
        }
        if (memberDiff.storage !== undefined) {
            await api(updateQuota(member.ID, memberDiff.storage));
        }
        if (memberDiff.vpn !== undefined) {
            await api(updateVPN(member.ID, memberDiff.vpn ? VPN_CONNECTIONS : 0));
        }
        if (memberDiff.role === MEMBER_ROLE.ORGANIZATION_ADMIN) {
            await dispatch(setAdminRole({ member, payload: memberKeyPacketPayload, api }));
        }
        if (memberDiff.role === MEMBER_ROLE.ORGANIZATION_MEMBER) {
            await api(updateRole(member.ID, MEMBER_ROLE.ORGANIZATION_MEMBER));
        }
        if (memberDiff.private) {
            await api(privatizeMember(member.ID));
        }
        return Object.values(memberDiff).some((value) => value !== undefined);
    };
};

export const createMember = ({
    member: model,
    verifiedDomains,
    keyTransparencyVerify,
    keyTransparencyCommit,
    verifyOutboundPublicKeys,
    api,
    validationOptions,
}: {
    member: CreateMemberPayload;
    verifiedDomains: Domain[] /* Remove dependency, move to thunk */;
    validationOptions: {
        disableStorageValidation?: boolean;
        disableDomainValidation?: boolean;
        disableAddressValidation?: boolean;
    };
    keyTransparencyVerify: KeyTransparencyVerify;
    keyTransparencyCommit: KeyTransparencyCommit;
    verifyOutboundPublicKeys: VerifyOutboundPublicKeys;
    api: Api;
}): ThunkAction<Promise<void>, OrganizationKeyState, ProtonThunkArguments, UnknownAction> => {
    return async (dispatch) => {
        const [userKeys, ownerAddresses, organizationKey, organization, members] = await Promise.all([
            dispatch(userKeysThunk()),
            dispatch(addressesThunk()),
            dispatch(organizationKeyThunk()),
            dispatch(organizationThunk()),
            dispatch(membersThunk()),
        ]);

        const self = members.find((member) => Boolean(member.Self));
        if (
            organization.MaxVPN > 0 &&
            self &&
            self.MaxVPN !== VPN_CONNECTIONS &&
            self.MaxVPN === organization.MaxVPN &&
            model.vpn
        ) {
            await api(updateVPN(self.ID, VPN_CONNECTIONS)).catch(noop);
        }

        const error = validateAddUser({
            privateUser: model.private,
            organization,
            organizationKeyInfo: getOrganizationKeyInfo(organization, organizationKey, ownerAddresses),
            verifiedDomains,
            ...validationOptions,
        });
        if (error) {
            throw new ValidationError(error);
        }
        const normalizedAddress = model.address;
        if (!validateEmailAddress(`${normalizedAddress.Local}@${normalizedAddress.Domain}`)) {
            throw new ValidationError(c('Error').t`Email address is invalid`);
        }

        if (!model.private) {
            if (!organizationKey?.privateKey) {
                throw new ValidationError(c('Error').t`Organization key must be activated to create non-private users`);
            }
        }

        if (model.private) {
            if (model.role === MEMBER_ROLE.ORGANIZATION_ADMIN) {
                if (getIsPasswordless(organizationKey?.Key)) {
                    throw new ValidationError(getPrivateAdminError());
                }
            }
        }

        await api(checkMemberAddressAvailability(model.address));

        const { Member } = await srpVerify<{ Member: Member }>({
            api,
            credentials: { password: model.password },
            config: createMemberConfig({
                Name: model.name || model.address.Local,
                Private: +model.private,
                MaxSpace: +model.storage,
                MaxVPN: model.vpn ? VPN_CONNECTIONS : 0,
            }),
        });

        const { Address: memberAddress } = await api<{ Address: Address }>(
            createMemberAddress(Member.ID, model.address)
        );
        const memberAddresses = [memberAddress];
        let memberWithKeys: Member | undefined;

        if (!model.private && organizationKey?.privateKey) {
            const result = await setupMemberKeys({
                api,
                ownerAddresses,
                member: Member,
                memberAddresses,
                organizationKey: organizationKey.privateKey,
                encryptionConfig: ENCRYPTION_CONFIGS[DEFAULT_ENCRYPTION_CONFIG],
                password: model.password,
                keyTransparencyVerify,
            });
            memberWithKeys = result.Member;
            await keyTransparencyCommit(userKeys);
        }

        if (model.role === MEMBER_ROLE.ORGANIZATION_ADMIN) {
            if (getIsPasswordless(organizationKey?.Key)) {
                if (!model.private && memberWithKeys) {
                    const memberKeyPayload = await getMemberKeyPayload({
                        organizationKey,
                        member: memberWithKeys,
                        memberAddresses,
                        mode: {
                            type: 'email',
                            verifyOutboundPublicKeys,
                        },
                        api,
                    });
                    await dispatch(setAdminRoles({ api, memberKeyPayloads: [memberKeyPayload] }));
                } else {
                    // Ignore, can't set non-private users admins on creation
                }
            } else {
                await api(updateRole(Member.ID, MEMBER_ROLE.ORGANIZATION_ADMIN));
            }
        }
    };
};
