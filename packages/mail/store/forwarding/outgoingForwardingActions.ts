import type { ThunkAction, UnknownAction } from '@reduxjs/toolkit';

import { addressKeysThunk } from '@proton/account/addressKeys';
import { setAddressFlags } from '@proton/account/addressKeys/actions';
import { type AddressesState, addressesThunk } from '@proton/account/addresses';
import type { KtState } from '@proton/account/kt';
import { type OrganizationKeyState } from '@proton/account/organizationKey';
import { type UserKeysState } from '@proton/account/userKeys';
import type { PrivateKeyReferenceV4, PublicKeyReference } from '@proton/crypto';
import {
    getOutgoingAddressForwarding,
    outgoingAddressForwardingsActions,
} from '@proton/mail/store/forwarding/outgoing';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import {
    type SetupForwardingParameters,
    deleteForwarding as deleteForwardingConfig,
    pauseForwarding as pauseForwardingConfig,
    resendForwardingInvitation as resendForwardingInvitationConfig,
    resumeForwarding as resumeForwardingConfig,
    setupForwarding as setupForwardingConfig,
    updateForwarding as updateForwardingConfig,
    updateForwardingFilter,
} from '@proton/shared/lib/api/forwardings';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import { getAddressFlagsData } from '@proton/shared/lib/helpers/address';
import { type Address, ForwardingType, type OutgoingAddressForwarding } from '@proton/shared/lib/interfaces';
import {
    type PrimaryAddressKeyForEncryption,
    getActiveAddressKeys,
    getPrimaryActiveAddressKeyForEncryption,
} from '@proton/shared/lib/keys';
import { getInternalParametersPrivate } from '@proton/shared/lib/keys/forward/forward';

type RequiredState = AddressesState & UserKeysState & OrganizationKeyState & KtState;

export const outgoingForwardingThunk = ({
    forward,
}: {
    forward: OutgoingAddressForwarding;
}): ThunkAction<Promise<void>, RequiredState, ProtonThunkArguments, UnknownAction> => {
    return async (dispatch, getState, extra) => {
        const result = await getOutgoingAddressForwarding(extra.api, forward.ID);
        dispatch(outgoingAddressForwardingsActions.upsertForwarding(result));
    };
};

export const toggleForwardingInvitation = ({
    forward,
    enabled,
}: {
    forward: OutgoingAddressForwarding;
    enabled: boolean;
}): ThunkAction<Promise<void>, RequiredState, ProtonThunkArguments, UnknownAction> => {
    return async (dispatch, _, extra) => {
        const api = getSilentApi(extra.api);
        if (!enabled) {
            await api(pauseForwardingConfig(forward.ID));
        } else {
            await api(resumeForwardingConfig(forward.ID));
        }
        await dispatch(outgoingForwardingThunk({ forward }));
    };
};

export const resendForwardingInvitation = ({
    forward,
}: {
    forward: OutgoingAddressForwarding;
}): ThunkAction<Promise<void>, RequiredState, ProtonThunkArguments, UnknownAction> => {
    return async (dispatch, _, extra) => {
        const api = getSilentApi(extra.api);
        await api(resendForwardingInvitationConfig(forward.ID));
        await dispatch(outgoingForwardingThunk({ forward }));
    };
};

export const requestConfirmation = ({
    encryptionKey,
    forward,
    forwardeePrimaryPublicKey,
}: {
    encryptionKey: PrimaryAddressKeyForEncryption;
    forwardeePrimaryPublicKey: PublicKeyReference;
    forward: OutgoingAddressForwarding;
}): ThunkAction<Promise<void>, RequiredState, ProtonThunkArguments, UnknownAction> => {
    return async (dispatch, _, extra) => {
        const api = getSilentApi(extra.api);
        const { activationToken, forwardeeKey, proxyInstances } = await getInternalParametersPrivate(
            encryptionKey,
            [
                {
                    email: forward.ForwardeeEmail,
                    name: forward.ForwardeeEmail,
                },
            ],
            forwardeePrimaryPublicKey
        );
        await api(
            updateForwardingConfig({
                ID: forward.ID,
                ForwardeePrivateKey: forwardeeKey,
                ActivationToken: activationToken,
                ProxyInstances: proxyInstances,
            })
        );
        await dispatch(outgoingForwardingThunk({ forward }));
    };
};

export const deleteForwarding = ({
    address,
    reActivateE2EE,
    forward,
}: {
    address?: Address;
    reActivateE2EE: boolean;
    forward: OutgoingAddressForwarding;
}): ThunkAction<Promise<void>, RequiredState, ProtonThunkArguments, UnknownAction> => {
    return async (dispatch, _, extra) => {
        const api = getSilentApi(extra.api);
        await api(deleteForwardingConfig(forward.ID));

        // Re-enable E2EE for this address if deleting last outgoing forwarding
        if (address && reActivateE2EE) {
            const data = getAddressFlagsData(address);
            if (data.isEncryptionDisabled) {
                await dispatch(
                    setAddressFlags({
                        address,
                        encryptionDisabled: false,
                        expectSignatureDisabled: data.isExpectSignatureDisabled,
                    })
                );
            }
        }

        dispatch(outgoingAddressForwardingsActions.deleteForwarding(forward));
    };
};

export const editFilter = ({
    forward,
    sieveTree,
}: {
    forward: OutgoingAddressForwarding;
    sieveTree: Parameters<typeof updateForwardingFilter>[1];
}): ThunkAction<Promise<void>, RequiredState, ProtonThunkArguments, UnknownAction> => {
    return async (dispatch, getState, extra) => {
        const silentApi = getSilentApi(extra.api);

        await silentApi(updateForwardingFilter(forward.ID, sieveTree, forward.Filter?.Version || 2));

        await dispatch(outgoingForwardingThunk({ forward }));
    };
};

export interface ForwardModalKeyState {
    forwardeePublicKey: PublicKeyReference | undefined;
    forwarderPrimaryKeysInfo: {
        v4: { ID: string; supportsE2EEForwarding: boolean };
        v6?: { ID: string; supportsE2EEForwarding: false };
    };
}

export const setupForwarding = ({
    // We take the addressID instead of the address itself since the latter is potentially
    // stale since it's getting modified by these actions and is called in succession
    forwarderAddressID,
    forwardeeEmail,
    forward,
    sieveTree,
    keyState,
    isReEnablingForwarding,
    isInternal,
    isExternal,
}: {
    forwarderAddressID: string;
    forward: OutgoingAddressForwarding | undefined;
    forwardeeEmail: string;
    keyState: ForwardModalKeyState;
    sieveTree: Parameters<typeof setupForwardingConfig>[0]['Tree'];
    isReEnablingForwarding: boolean | undefined;
    isInternal: boolean | undefined;
    isExternal: boolean | undefined;
}): ThunkAction<Promise<void>, RequiredState, ProtonThunkArguments, UnknownAction> => {
    return async (dispatch, getState, extra) => {
        const forwarderAddress = (await dispatch(addressesThunk())).find(
            (address) => forwarderAddressID === address.ID
        );
        if (!forwarderAddress) {
            throw new Error('Address deleted');
        }

        const forwardVersion = forward?.Filter?.Version || 2;
        const forwardID = forward?.ID;

        const setupForwardingParams: Omit<SetupForwardingParameters, 'Tree' /* added later */> = {
            ForwarderAddressID: forwarderAddress.ID,
            ForwardeeEmail: forwardeeEmail,
            Type: isInternal ? ForwardingType.InternalEncrypted : ForwardingType.ExternalUnencrypted,
            Version: forwardVersion,
        };

        const silentApi = getSilentApi(extra.api);

        // e2ee forwarding case
        if (isInternal && keyState.forwardeePublicKey && keyState.forwarderPrimaryKeysInfo) {
            const forwarderAddressKeys = await dispatch(addressKeysThunk({ addressID: forwarderAddressID }));
            // useGetAddressKeysByUsage would be preferable, but since we need the ActiveKey helpers
            // for the setup phase, we reuse them here.
            const activeKeysByVersion = await getActiveAddressKeys(
                forwarderAddress.SignedKeyList,
                forwarderAddressKeys
            );
            const forwarderKey = getPrimaryActiveAddressKeyForEncryption(
                activeKeysByVersion,
                // set for sanity checks: v6 is never actually returned, since it's dealt with in
                // `fixupPrimaryKeyV6`
                true
            ).privateKey as PrivateKeyReferenceV4;

            const { activationToken, forwardeeKey, proxyInstances } = await getInternalParametersPrivate(
                forwarderKey,
                [{ email: forwardeeEmail, name: forwardeeEmail }],
                keyState.forwardeePublicKey
            );

            const e2eeForwardingParams = {
                ForwardeePrivateKey: forwardeeKey,
                ActivationToken: activationToken,
                ProxyInstances: proxyInstances,
            };

            if (isReEnablingForwarding && forwardID) {
                const { OutgoingAddressForwarding } = await silentApi<{
                    OutgoingAddressForwarding: OutgoingAddressForwarding;
                }>(
                    updateForwardingConfig({
                        ID: forwardID,
                        ...e2eeForwardingParams,
                    })
                );
                dispatch(outgoingAddressForwardingsActions.upsertForwarding(OutgoingAddressForwarding));
            } else {
                const { OutgoingAddressForwarding } = await silentApi<{
                    OutgoingAddressForwarding: OutgoingAddressForwarding;
                }>(
                    setupForwardingConfig({
                        ...setupForwardingParams,
                        Tree: sieveTree,
                        ...e2eeForwardingParams,
                    })
                );
                dispatch(outgoingAddressForwardingsActions.upsertForwarding(OutgoingAddressForwarding));
            }
        } else {
            const addressFlags = getAddressFlagsData(forwarderAddress);
            // Disable encryption if the email is external
            if (isExternal && !addressFlags.isEncryptionDisabled) {
                await dispatch(
                    setAddressFlags({
                        address: forwarderAddress,
                        encryptionDisabled: true,
                        expectSignatureDisabled: addressFlags.isExpectSignatureDisabled,
                    })
                );
            }

            const { OutgoingAddressForwarding } = await silentApi<{
                OutgoingAddressForwarding: OutgoingAddressForwarding;
            }>(
                setupForwardingConfig({
                    ...setupForwardingParams,
                    Tree: sieveTree,
                })
            );
            dispatch(outgoingAddressForwardingsActions.upsertForwarding(OutgoingAddressForwarding));
        }
    };
};
