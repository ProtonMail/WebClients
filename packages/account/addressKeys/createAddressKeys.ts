import type { ThunkAction, UnknownAction } from '@reduxjs/toolkit';
import { c } from 'ttag';

import { createKTVerifier } from '@proton/key-transparency/helpers';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { CacheType } from '@proton/redux-utilities/interface';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import { DEFAULT_KEYGEN_TYPE, KEYGEN_CONFIGS, MEMBER_PRIVATE } from '@proton/shared/lib/constants';
import type { Address, Member, UserModel } from '@proton/shared/lib/interfaces';
import {
    getCanGenerateMemberKeys,
    getShouldSetupMemberKeys,
    missingKeysMemberProcess,
    missingKeysSelfProcess,
    setupMemberKeys,
} from '@proton/shared/lib/keys';
import { getOrganizationKeyInfo, validateOrganizationKey } from '@proton/shared/lib/organization/helper';

import { type AddressesState, addressesThunk } from '../addresses';
import type { KtState } from '../kt';
import { getKTActivation } from '../kt/actions';
import { type MemberState, memberThunk } from '../member';
import { type MembersState, getMemberAddresses, upsertMember } from '../members';
import { getMember } from '../members/getMember';
import { type OrganizationState, organizationThunk } from '../organization';
import { type OrganizationKeyState, organizationKeyThunk } from '../organizationKey';
import { type UserState, userThunk } from '../user';
import { type UserKeysState, userKeysThunk } from '../userKeys';
import { type UserSettingsState, userSettingsThunk } from '../userSettings';

export type AddressKeyCreationRequiredState = KtState &
    UserState &
    OrganizationState &
    OrganizationKeyState &
    MembersState &
    AddressesState &
    UserKeysState &
    MemberState &
    UserSettingsState;

type AddressKeyCreationPayload =
    | {
          type: 'user';
          payload: {
              user: UserModel;
              setupUserKeys: boolean;
          };
      }
    | {
          type: 'private-member';
          payload: {
              member: Member;
          };
      }
    | {
          type: 'non-private-member';
          payload: {
              member: Member;
              setupPassword: string;
              shouldSetupMemberKeys: boolean;
          };
      };

export const getCreateAddressKeysPayload = ({
    member: maybeMember,
    password: memberPassword,
}: {
    member?: Member; // Undefined is self
    password?: string; // Plaintext password to set up the member (if needed)
} = {}): ThunkAction<
    Promise<AddressKeyCreationPayload>,
    AddressKeyCreationRequiredState,
    ProtonThunkArguments,
    UnknownAction
> => {
    return async (dispatch, _) => {
        const user = await dispatch(userThunk());
        const organizationKey = await dispatch(organizationKeyThunk());

        // If it's intended for SELF, AND it's a private user, we can go ahead and generate.
        if ((!maybeMember || maybeMember.Self) && user.Private === MEMBER_PRIVATE.UNREADABLE) {
            const userKeys = await dispatch(userKeysThunk());
            if (user.Keys.length && !userKeys.length) {
                throw new Error('Invalid user keys state');
            }
            return {
                type: 'user',
                payload: {
                    user,
                    setupUserKeys: !user.Keys.length,
                },
            } as const;
        }

        let member = maybeMember;
        // If it's for self, and it's a non-private user, we _need_ the member object to proceed.
        if (!member && user.Private === MEMBER_PRIVATE.READABLE) {
            member = await dispatch(memberThunk());

            // memberThunk can apparently return {}.
            if (!member?.ID) {
                throw new Error('Missing member ID');
            }
        }

        if (!member) {
            throw new Error('Unexpected key generation state');
        }

        if (member.Private === MEMBER_PRIVATE.UNREADABLE) {
            return {
                type: 'private-member',
                payload: {
                    member,
                },
            } as const;
        }

        const shouldGenerateKeys = getCanGenerateMemberKeys(member);
        const shouldSetupMemberKeys = shouldGenerateKeys && getShouldSetupMemberKeys(member);

        if (shouldGenerateKeys && !organizationKey?.privateKey) {
            throw new Error(c('Error').t`Organization key is not decrypted`);
        }

        if (shouldSetupMemberKeys && !memberPassword) {
            throw new Error('Member password required when setting up keys');
        }

        return {
            type: 'non-private-member',
            payload: {
                member,
                shouldSetupMemberKeys,
                setupPassword: memberPassword ?? '',
            } as const,
        };
    };
};

export const createAddressKeysThunk = ({
    addressKeyCreationPayload,
    addressesToGenerate,
    onUpdate,
}: {
    addressKeyCreationPayload: AddressKeyCreationPayload;
    addressesToGenerate: Address[];
    onUpdate?: Parameters<typeof missingKeysMemberProcess>[0]['onUpdate'];
}): ThunkAction<Promise<Address[]>, AddressKeyCreationRequiredState, ProtonThunkArguments, UnknownAction> => {
    return async (dispatch, _, extra) => {
        const api = getSilentApi(extra.api);

        const { keyTransparencyVerify, keyTransparencyCommit } = createKTVerifier({
            ktActivation: dispatch(getKTActivation()),
            api,
            config: extra.config,
        });

        const keyGenConfig = KEYGEN_CONFIGS[DEFAULT_KEYGEN_TYPE];

        const processMember = async (
            addressKeyCreationPayload: Extract<AddressKeyCreationPayload, { type: 'non-private-member' }>
        ) => {
            const member = addressKeyCreationPayload.payload.member;

            const [user, organization, organizationKey, memberAddresses, addresses, userKeys] = await Promise.all([
                dispatch(userThunk()),
                dispatch(organizationThunk()),
                dispatch(organizationKeyThunk()),
                dispatch(getMemberAddresses({ member, retry: true })),
                dispatch(addressesThunk()),
                dispatch(userKeysThunk()),
            ]);

            const error = validateOrganizationKey(getOrganizationKeyInfo(organization, organizationKey, addresses));
            if (error) {
                throw new Error(error);
            }
            if (!organizationKey?.privateKey) {
                throw new Error('Missing key');
            }

            if (addressKeyCreationPayload.payload.shouldSetupMemberKeys) {
                await setupMemberKeys({
                    ownerAddresses: addresses,
                    keyGenConfig,
                    organizationKey: organizationKey.privateKey,
                    member,
                    memberAddresses,
                    password: addressKeyCreationPayload.payload.setupPassword,
                    api,
                    keyTransparencyVerify,
                });

                await keyTransparencyCommit(user, userKeys);
                // Refetch the member to get the updated keys
                dispatch(upsertMember({ member: await getMember(api, member.ID) }));
                // Refetch all the addresses to get the updated key for the address that was just created.
                const updatedAddresses = await dispatch(
                    getMemberAddresses({ member, cache: CacheType.None, retry: true })
                );

                if (onUpdate) {
                    addressesToGenerate.forEach((address) => onUpdate(address.ID, { status: 'ok' }));
                }

                return updatedAddresses;
            } else {
                const result = await missingKeysMemberProcess({
                    api,
                    keyGenConfig,
                    ownerAddresses: addresses,
                    memberAddressesToGenerate: addressesToGenerate,
                    member,
                    memberAddresses,
                    onUpdate,
                    organizationKey: organizationKey.privateKey,
                    keyTransparencyVerify,
                });

                const updatedAddresses = await dispatch(
                    getMemberAddresses({ member, cache: CacheType.None, retry: true })
                );

                const errorResult = result.find((result) => result.type === 'error');
                if (errorResult) {
                    throw errorResult.e;
                }

                return updatedAddresses;
            }
        };

        const processSelf = async (addressKeyCreationPayload: Extract<AddressKeyCreationPayload, { type: 'user' }>) => {
            if (addressKeyCreationPayload.payload.setupUserKeys) {
                throw new Error('User key setup not happening here');
            }
            const [user, userKeys, addresses, userSettings] = await Promise.all([
                dispatch(userThunk()),
                dispatch(userKeysThunk()),
                dispatch(addressesThunk()),
                dispatch(userSettingsThunk()),
            ]);
            const result = await missingKeysSelfProcess({
                api,
                userKeys,
                addresses,
                addressesToGenerate,
                password: extra.authentication.getPassword(),
                keyGenConfigForV4Keys: keyGenConfig,
                supportV6Keys: !!userSettings.Flags.SupportPgpV6Keys,
                onUpdate,
                keyTransparencyVerify,
            });

            await keyTransparencyCommit(user, userKeys);
            // Refetch all the addresses to get the updated key for the address that was just created.
            // This can be optimized by just updating the address in question.
            const updatedAddresses = await dispatch(addressesThunk({ cache: CacheType.None }));

            const errorResult = result.find((result) => result.type === 'error');
            if (errorResult) {
                throw errorResult.e;
            }

            return updatedAddresses;
        };

        if (addressKeyCreationPayload.type === 'user') {
            return processSelf(addressKeyCreationPayload);
        }
        if (addressKeyCreationPayload.type === 'non-private-member') {
            return processMember(addressKeyCreationPayload);
        }
        // Otherwise (private member), there's nothing to do. However, we still return an updated list of addresses since this
        // thunk is expected to return it. This ensures that a newly created address is still returned.
        return dispatch(
            getMemberAddresses({ member: addressKeyCreationPayload.payload.member, cache: CacheType.None, retry: true })
        );
    };
};
