import { ThunkAction, UnknownAction } from '@reduxjs/toolkit';
import { c } from 'ttag';

import type { ProtonThunkArguments } from '@proton/redux-shared-store';
import { getApiError } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import {
    checkMemberAddressAvailability,
    createMemberAddress,
    createMember as createMemberConfig,
    privatizeMember,
    updateAI,
    updateName,
    updateQuota,
    updateRole,
    updateVPN,
} from '@proton/shared/lib/api/members';
import {
    DEFAULT_KEYGEN_TYPE,
    HTTP_STATUS_CODE,
    KEYGEN_CONFIGS,
    MEMBER_ROLE,
    VPN_CONNECTIONS,
} from '@proton/shared/lib/constants';
import { validateEmailAddress } from '@proton/shared/lib/helpers/email';
import {
    Address,
    Api,
    CreateMemberMode,
    Domain,
    KeyTransparencyCommit,
    KeyTransparencyVerify,
    Member,
    VerifyOutboundPublicKeys,
} from '@proton/shared/lib/interfaces';
import {
    getInvitationData,
    getIsPasswordless,
    getSignedInvitationData,
    setupMemberKeys,
} from '@proton/shared/lib/keys';
import { getOrganizationKeyInfo } from '@proton/shared/lib/organization/helper';
import { srpVerify } from '@proton/shared/lib/srp';
import noop from '@proton/utils/noop';

import { addressesThunk } from '../addresses';
import { organizationThunk } from '../organization';
import { OrganizationKeyState, organizationKeyThunk } from '../organizationKey';
import { MemberKeyPayload, getMemberKeyPayload, getPrivateAdminError, setAdminRoles } from '../organizationKey/actions';
import { userKeysThunk } from '../userKeys';
import InvalidAddressesError from './errors/InvalidAddressesError';
import UnavailableAddressesError from './errors/UnavailableAddressesError';
import { MemberCreationValidationError, membersThunk } from './index';
import validateAddUser from './validateAddUser';

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
    addresses: { Local: string; Domain: string }[];
    invitationEmail: string;
    mode: CreateMemberMode;
    private: boolean;
    storage: number;
    vpn?: boolean;
    password: string;
    role: MEMBER_ROLE | null;
    numAI: boolean;
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
        if (memberDiff.numAI !== undefined) {
            await api(updateAI(member.ID, memberDiff.numAI ? 1 : 0));
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
    member: originalModel,
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
        let [userKeys, ownerAddresses, organizationKey, organization, members] = await Promise.all([
            dispatch(userKeysThunk()),
            dispatch(addressesThunk()),
            dispatch(organizationKeyThunk()),
            dispatch(organizationThunk()),
            dispatch(membersThunk()),
        ]);

        const model = { ...originalModel };
        // Force role to member in invitation creation since it can't be created as anything else
        if (model.mode === CreateMemberMode.Invitation) {
            model.role = MEMBER_ROLE.ORGANIZATION_MEMBER;
        }

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
            throw new MemberCreationValidationError(error);
        }

        const invalidAddresses: string[] = [];
        const invalidInvitationAddresses: string[] = [];
        const validAddresses: string[] = [];

        const addressParts = model.addresses.map((parts) => {
            const emailAddress = `${parts.Local}@${parts.Domain}`;
            const isValid = validateEmailAddress(emailAddress);
            if (!isValid) {
                invalidAddresses.push(emailAddress);
            } else {
                validAddresses.push(emailAddress);
            }
            return {
                address: emailAddress,
                ...parts,
            };
        });

        if (model.mode === CreateMemberMode.Invitation) {
            if (!validateEmailAddress(model.invitationEmail)) {
                invalidInvitationAddresses.push(model.invitationEmail);
            }
        }

        if (invalidAddresses.length || invalidInvitationAddresses.length) {
            /**
             * Throw if any of the addresses are not valid
             */
            throw new InvalidAddressesError(invalidAddresses, invalidInvitationAddresses, validAddresses);
        }

        if (!model.private) {
            if (!organizationKey?.privateKey) {
                throw new MemberCreationValidationError(
                    c('Error').t`Organization key must be activated to create non-private users`
                );
            }
        }

        if (model.private) {
            if (model.role === MEMBER_ROLE.ORGANIZATION_ADMIN) {
                if (getIsPasswordless(organizationKey?.Key)) {
                    throw new MemberCreationValidationError(getPrivateAdminError());
                }
            }
        }

        const unavailableAddresses: { message: string; address: string }[] = [];
        const availableAddresses: string[] = [];

        const checkAddressAvailability = async ({ Local, Domain }: { Local: string; Domain: string }) => {
            const address = `${Local}@${Domain}`;
            try {
                await api(
                    checkMemberAddressAvailability({
                        Local,
                        Domain,
                    })
                );
                availableAddresses.push(address);
            } catch (error: any) {
                const { status, message } = getApiError(error);
                if (status === HTTP_STATUS_CODE.CONFLICT) {
                    // Conflict error from address being not available
                    unavailableAddresses.push({ message, address });
                    return;
                }

                throw error;
            }
        };

        const [firstAddressParts, ...restAddressParts] = addressParts;

        /**
         * Will prompt password prompt only once
         */
        await checkAddressAvailability(firstAddressParts);

        /**
         * No more password prompts will be needed
         */
        await Promise.all(restAddressParts.map(checkAddressAvailability));

        if (unavailableAddresses.length) {
            /**
             * Throw if any of the addresses are not available
             */
            throw new UnavailableAddressesError(unavailableAddresses, availableAddresses);
        }

        const payload = {
            Name: model.name || firstAddressParts.Local,
            Private: +model.private,
            MaxSpace: +model.storage,
            MaxVPN: model.vpn ? VPN_CONNECTIONS : 0,
            MaxAI: model.numAI ? 1 : 0,
        };

        if (model.mode === CreateMemberMode.Invitation) {
            if (!organizationKey?.privateKey) {
                throw new MemberCreationValidationError(
                    c('Error').t`Organization key must be activated to create invited users`
                );
            }
            const invitationData = await getInvitationData({
                api,
                address: `${firstAddressParts.Local}@${firstAddressParts.Domain}`,
            });
            const invitationSignature = await getSignedInvitationData(organizationKey.privateKey, invitationData);
            await api(
                createMemberConfig({
                    ...payload,
                    Private: 1,
                    Invitation: {
                        Email: model.invitationEmail,
                        Data: invitationData,
                        Signature: invitationSignature,
                    },
                })
            ).then(({ Member }) => Member);
            return;
        }

        const Member = await srpVerify<{ Member: Member }>({
            api,
            credentials: { password: model.password },
            config: createMemberConfig({
                ...payload,
            }),
        }).then(({ Member }) => Member);

        const memberAddresses: Address[] = [];
        for (const { Local, Domain } of model.addresses) {
            const { Address } = await api<{ Address: Address }>(
                createMemberAddress(Member.ID, {
                    Local,
                    Domain,
                })
            );
            memberAddresses.push(Address);
        }
        let memberWithKeys: Member | undefined;

        organizationKey = await dispatch(organizationKeyThunk()); // Ensure latest key
        if (!model.private && organizationKey?.privateKey) {
            const result = await setupMemberKeys({
                api,
                ownerAddresses,
                member: Member,
                memberAddresses,
                organizationKey: organizationKey.privateKey,
                keyGenConfig: KEYGEN_CONFIGS[DEFAULT_KEYGEN_TYPE],
                password: model.password,
                keyTransparencyVerify,
            });
            memberWithKeys = result.Member;
            await keyTransparencyCommit(userKeys);
        }

        if (model.role === MEMBER_ROLE.ORGANIZATION_ADMIN) {
            organizationKey = await dispatch(organizationKeyThunk()); // Ensure latest key
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
