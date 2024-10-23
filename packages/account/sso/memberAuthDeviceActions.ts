import type { UnknownAction } from '@reduxjs/toolkit';
import type { ThunkAction } from 'redux-thunk';
import { c } from 'ttag';

import { CryptoProxy } from '@proton/crypto';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { activateMemberAuthDeviceConfig, rejectMemberAuthDeviceConfig } from '@proton/shared/lib/api/authDevice';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import type { DecryptedKey, Member } from '@proton/shared/lib/interfaces';
import { generateKeySaltAndPassphrase, getMemberKeys } from '@proton/shared/lib/keys';
import type { DeviceSecretData, MemberAuthDeviceOutput } from '@proton/shared/lib/keys/device';
import {
    AuthDeviceState,
    decryptAuthDeviceActivationToken,
    encryptAuthDeviceSecret,
    getValidActivation,
} from '@proton/shared/lib/keys/device';
import { generatePassword } from '@proton/shared/lib/password';
import noop from '@proton/utils/noop';

import { getMemberAddresses } from '../members';
import { getMemberToUnprivatizeApproval, unprivatizeApprovalMembers } from '../members/unprivatizeMembers';
import { organizationKeyThunk } from '../organizationKey';
import type { MemberAuthDevicesState, PendingAdminActivation } from './memberAuthDevices';
import { memberAuthDeviceActions } from './memberAuthDevices';

export interface ConfirmMemberAuthDeviceData {
    activation: ReturnType<typeof getValidActivation>;
    deviceSecretData: DeviceSecretData;
    pendingAuthDevice: MemberAuthDeviceOutput;
    member: Member;
    memberUserKeys: DecryptedKey[];
    cleanup: () => void;
}

export const prepareConfirmPendingMemberAuthDevice = ({
    memberAuthDevice,
    member: initialMember,
}: {
    memberAuthDevice: MemberAuthDeviceOutput;
    member: Member;
}): ThunkAction<Promise<ConfirmMemberAuthDeviceData>, MemberAuthDevicesState, ProtonThunkArguments, UnknownAction> => {
    return async (dispatch) => {
        let member = initialMember;
        const [memberAddresses, organizationKey] = await Promise.all([
            dispatch(getMemberAddresses({ member, retry: true })),
            dispatch(organizationKeyThunk()),
        ]);
        const activation = getValidActivation({ addresses: memberAddresses, pendingAuthDevice: memberAuthDevice });
        if (!activation) {
            throw new Error('Unable to find member address for device');
        }
        if (!organizationKey?.privateKey) {
            throw new Error('Organization key must be activated to activate a member device');
        }
        // If the member needs to get unprivatized, let's do it first
        if (getMemberToUnprivatizeApproval(member)) {
            const [updatedMember] = await dispatch(unprivatizeApprovalMembers({ membersToUnprivatize: [member] }));
            if (updatedMember) {
                member = updatedMember;
            }
        }
        const { memberUserKeys, memberAddressesKeys } = await getMemberKeys({
            member,
            memberAddresses,
            organizationKey: {
                privateKey: organizationKey.privateKey,
                publicKey: organizationKey.publicKey,
            },
        });
        const addressKeys =
            memberAddressesKeys.find(({ address }) => {
                return address.ID === activation.address.ID;
            })?.keys || [];
        const deviceSecretData = await decryptAuthDeviceActivationToken({
            deviceID: memberAuthDevice.ID,
            decryptionKeys: addressKeys.map(({ privateKey }) => privateKey),
            armoredMessage: activation.token,
        });
        return {
            deviceSecretData,
            activation,
            pendingAuthDevice: memberAuthDevice,
            member,
            memberUserKeys,
            cleanup: () => {
                memberUserKeys.forEach((memberUserKey) => {
                    CryptoProxy.clearKey({ key: memberUserKey.privateKey }).catch(noop);
                    CryptoProxy.clearKey({ key: memberUserKey.publicKey }).catch(noop);
                });
                memberAddressesKeys.forEach((memberAddressKeys) => {
                    memberAddressKeys.keys.forEach((memberAddressKey) => {
                        CryptoProxy.clearKey({ key: memberAddressKey.privateKey }).catch(noop);
                        CryptoProxy.clearKey({ key: memberAddressKey.publicKey }).catch(noop);
                    });
                });
            },
        };
    };
};

const getReEncryptedMemberUserKeys = async (memberUserKeys: DecryptedKey[]) => {
    const password = generatePassword({ useSpecialChars: true, length: 16 });
    const { passphrase } = await generateKeySaltAndPassphrase(password);
    const reEncryptedMemberUserKeys = await Promise.all(
        memberUserKeys.map(async ({ ID, privateKey }) => {
            return {
                ID,
                PrivateKey: await CryptoProxy.exportPrivateKey({ privateKey, passphrase }),
            };
        })
    );

    return {
        keyPassword: passphrase,
        memberUserKeys: reEncryptedMemberUserKeys,
    };
};

export const confirmPendingMemberAuthDevice = ({
    confirmationCode,
    pendingMemberAuthDevice,
}: {
    confirmationCode: string;
    pendingMemberAuthDevice: PendingAdminActivation;
}): ThunkAction<Promise<void>, MemberAuthDevicesState, ProtonThunkArguments, UnknownAction> => {
    return async (dispatch, getState, extra) => {
        const confirmMemberAuthDeviceData = await dispatch(
            prepareConfirmPendingMemberAuthDevice(pendingMemberAuthDevice)
        );
        try {
            if (confirmMemberAuthDeviceData.deviceSecretData.confirmationCode !== confirmationCode) {
                throw new Error(c('sso').t`Invalid confirmation code`);
            }
            const api = getSilentApi(extra.api);
            const { keyPassword, memberUserKeys } = await getReEncryptedMemberUserKeys(
                confirmMemberAuthDeviceData.memberUserKeys
            );
            const encryptedSecret = await encryptAuthDeviceSecret({
                keyPassword,
                deviceSecretData: confirmMemberAuthDeviceData.deviceSecretData,
            });
            await api(
                activateMemberAuthDeviceConfig({
                    MemberID: confirmMemberAuthDeviceData.member.ID,
                    AuthDeviceID: confirmMemberAuthDeviceData.pendingAuthDevice.ID,
                    EncryptedSecret: encryptedSecret,
                    UserKeys: memberUserKeys,
                })
            );
            dispatch(
                memberAuthDeviceActions.updateMemberAuthDevice({
                    ID: confirmMemberAuthDeviceData.pendingAuthDevice.ID,
                    State: AuthDeviceState.Active,
                })
            );
        } finally {
            confirmMemberAuthDeviceData.cleanup();
        }
    };
};

export const rejectMemberAuthDevice = ({
    memberID,
    memberAuthDevice,
    type,
}: {
    memberID: string;
    memberAuthDevice: MemberAuthDeviceOutput;
    type: 'reject' | 'delete';
}): ThunkAction<Promise<void>, MemberAuthDevicesState, ProtonThunkArguments, UnknownAction> => {
    return async (dispatch, getState, extra) => {
        const api = getSilentApi(extra.api);
        if (type === 'delete') {
            throw new Error('todo');
        } else {
            await api(rejectMemberAuthDeviceConfig({ MemberID: memberID, DeviceID: memberAuthDevice.ID }));
            dispatch(
                memberAuthDeviceActions.updateMemberAuthDevice({
                    ID: memberAuthDevice.ID,
                    State: AuthDeviceState.Rejected,
                })
            );
        }
    };
};
