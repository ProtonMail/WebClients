import type { ThunkAction, UnknownAction } from '@reduxjs/toolkit';
import { c } from 'ttag';

import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { CacheType } from '@proton/redux-utilities';
import { getApiError } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import {
    checkMemberAddressAvailability,
    createMemberAddress,
    createMember as createMemberConfig,
    deleteUnprivatizationRequest,
    getMember as getMemberConfig,
    privatizeMember as privatizeMemberConfig,
    requestUnprivatization as requestUnprivatizationConfig,
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
    MEMBER_PRIVATE,
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
import { CreateMemberMode } from '@proton/shared/lib/interfaces';
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
import type { OrganizationKeyState } from '../organizationKey';
import { organizationKeyThunk } from '../organizationKey';
import type { MemberKeyPayload } from '../organizationKey/actions';
import { getMemberKeyPayload, getPrivateAdminError, setAdminRoles } from '../organizationKey/actions';
import { userKeysThunk } from '../userKeys';
import InvalidAddressesError from './errors/InvalidAddressesError';
import UnavailableAddressesError from './errors/UnavailableAddressesError';
import { MemberCreationValidationError, membersThunk, upsertMember } from './index';
import validateAddUser from './validateAddUser';

const getMember = (api: Api, memberID: string) =>
    api<{
        Member: Member;
    }>(getMemberConfig(memberID)).then(({ Member }) => Member);

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

export const requestUnprivatization = ({
    api,
    member,
    upsert,
}: {
    api: Api;
    member: Member;
    upsert: boolean;
}): ThunkAction<Promise<void>, OrganizationKeyState, ProtonThunkArguments, UnknownAction> => {
    return async (dispatch) => {
        const organizationKey = await dispatch(organizationKeyThunk()); // Ensure latest key
        if (!organizationKey?.privateKey) {
            throw new MemberCreationValidationError(
                c('unprivatization').t`Organization key must be activated to request data access`
            );
        }
        const primaryEmailAddress = member.Addresses?.[0].Email;
        if (!primaryEmailAddress) {
            throw new MemberCreationValidationError(
                c('unprivatization').t`The user must have an address to request data access`
            );
        }
        const invitationData = await getInvitationData({
            api,
            address: primaryEmailAddress,
            expectRevisionChange: false,
        });
        const invitationSignature = await getSignedInvitationData(organizationKey.privateKey, invitationData);
        await api(
            requestUnprivatizationConfig(member.ID, {
                InvitationData: invitationData,
                InvitationSignature: invitationSignature,
            })
        );
        if (upsert) {
            dispatch(upsertMember({ member: await getMember(api, member.ID) }));
        }
    };
};

export const deleteRequestUnprivatization = ({
    api,
    member,
    upsert,
}: {
    api: Api;
    member: Member;
    upsert: boolean;
}): ThunkAction<Promise<void>, OrganizationKeyState, ProtonThunkArguments, UnknownAction> => {
    return async (dispatch) => {
        if (member.Unprivatization === null) {
            return;
        }
        await api(deleteUnprivatizationRequest(member.ID));
        if (upsert) {
            dispatch(upsertMember({ member: await getMember(api, member.ID) }));
        }
    };
};

export const privatizeMember = ({
    api,
    member,
    upsert,
}: {
    api: Api;
    member: Member;
    upsert: boolean;
}): ThunkAction<Promise<void>, OrganizationKeyState, ProtonThunkArguments, UnknownAction> => {
    return async (dispatch) => {
        await api(privatizeMemberConfig(member.ID));
        if (upsert) {
            dispatch(upsertMember({ member: await getMember(api, member.ID) }));
        }
    };
};

interface CreateMemberPayload {
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
}): ThunkAction<
    Promise<{ diff: true; member: Member } | { diff: false; member: null }>,
    OrganizationKeyState,
    ProtonThunkArguments,
    UnknownAction
> => {
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
        if (memberDiff.private !== undefined) {
            if (memberDiff.private === MEMBER_PRIVATE.UNREADABLE) {
                if (member.Unprivatization) {
                    await dispatch(deleteRequestUnprivatization({ member, api, upsert: false }));
                } else {
                    await dispatch(privatizeMember({ member, api, upsert: false }));
                }
            }
            if (member.Private === MEMBER_PRIVATE.UNREADABLE && memberDiff.private === MEMBER_PRIVATE.READABLE) {
                await dispatch(requestUnprivatization({ member, api, upsert: false }));
            }
        }
        const diff = Object.values(memberDiff).some((value) => value !== undefined);
        if (diff) {
            const [updatedMember] = await Promise.all([
                getMember(api, member.ID),
                // Upserting the member also has an effect on the org values, so they need to be updated too.
                dispatch(organizationThunk({ cache: CacheType.None })),
            ]);
            dispatch(upsertMember({ member: updatedMember }));
            return {
                diff: true,
                member: updatedMember,
            };
        }
        return {
            diff: false,
            member: null,
        };
    };
};

const createAddressesForMember = async ({
    api,
    addresses,
    member,
}: {
    member: Member;
    api: Api;
    addresses: { Local: string; Domain: string }[];
}) => {
    const memberAddresses: Address[] = [];
    for (const { Local, Domain } of addresses) {
        const { Address } = await api<{ Address: Address }>(
            createMemberAddress(member.ID, {
                Local,
                Domain,
            })
        );
        memberAddresses.push(Address);
    }
    return memberAddresses;
};

export const createMember = ({
    member: originalModel,
    single,
    verifiedDomains,
    keyTransparencyVerify,
    keyTransparencyCommit,
    verifyOutboundPublicKeys,
    api,
    validationOptions,
}: {
    member: CreateMemberPayload;
    single: boolean;
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
            privateUser: model.private === MEMBER_PRIVATE.UNREADABLE,
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

        if (model.mode === CreateMemberMode.Password) {
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
        }

        if (model.mode === CreateMemberMode.Invitation) {
            if (!organizationKey?.privateKey) {
                throw new MemberCreationValidationError(
                    c('Error').t`Organization key must be activated to create invited users`
                );
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
            MaxSpace: +model.storage,
            MaxVPN: model.vpn ? VPN_CONNECTIONS : 0,
            MaxAI: model.numAI ? 1 : 0,
        };

        if (model.mode === CreateMemberMode.Invitation) {
            organizationKey = await dispatch(organizationKeyThunk()); // Ensure latest key
            if (!organizationKey?.privateKey) {
                throw new MemberCreationValidationError(
                    c('Error').t`Organization key must be activated to create invited users`
                );
            }
            const invitationData = await getInvitationData({
                api,
                address: `${firstAddressParts.Local}@${firstAddressParts.Domain}`,
                expectRevisionChange: true,
            });
            const invitationSignature = await getSignedInvitationData(organizationKey.privateKey, invitationData);
            const Member = await api(
                createMemberConfig({
                    ...payload,
                    Invitation: {
                        Email: model.invitationEmail,
                        Data: invitationData,
                        Signature: invitationSignature,
                        PrivateIntent: model.private === MEMBER_PRIVATE.UNREADABLE,
                    },
                })
            ).then(({ Member }) => Member);

            if (model.private) {
                await createAddressesForMember({
                    api,
                    member: Member,
                    addresses: model.addresses,
                });
            }

            const [updatedMember] = await Promise.all([
                getMember(api, Member.ID),
                // Upserting the member also has an effect on the org values, so they need to be updated too.
                single ? dispatch(organizationThunk({ cache: CacheType.None })) : undefined,
            ]);
            dispatch(upsertMember({ member: updatedMember }));
            return;
        }

        const Member = await srpVerify<{ Member: Member }>({
            api,
            credentials: { password: model.password },
            config: createMemberConfig({
                ...payload,
                Private: +(model.private === MEMBER_PRIVATE.UNREADABLE),
            }),
        }).then(({ Member }) => Member);

        const memberAddresses = await createAddressesForMember({
            api,
            member: Member,
            addresses: model.addresses,
        });

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

        const [updatedMember] = await Promise.all([
            getMember(api, Member.ID),
            // Upserting the member also has an effect on the org values, so they need to be updated too.
            single ? dispatch(organizationThunk({ cache: CacheType.None })) : undefined,
        ]);
        dispatch(upsertMember({ member: updatedMember }));
    };
};
