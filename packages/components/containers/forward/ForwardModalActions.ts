import type { UnknownAction } from '@reduxjs/toolkit';
import type { ThunkAction } from 'redux-thunk';

import { type AddressKeysState, addressKeysThunk } from '@proton/account/addressKeys';
import { setAddressFlags } from '@proton/account/addressKeys/actions';
import { addressesThunk } from '@proton/account/addresses';
import type { DomainsState } from '@proton/account/domains';
import type { KtState } from '@proton/account/kt';
import { getKTActivation } from '@proton/account/kt/actions';
import type { OrganizationState } from '@proton/account/organization';
import { userThunk } from '@proton/account/user';
import { userKeysThunk } from '@proton/account/userKeys';
import { getInternalParametersPrivate, getSieveTree } from '@proton/components/containers/forward/helpers';
import {
    generateNewE2EEForwardingCompatibleAddressKey,
    handleUnsetV6PrimaryKey,
} from '@proton/components/containers/forward/keyHelpers';
import { CryptoProxy, type PrivateKeyReferenceV4, type PublicKeyReference } from '@proton/crypto';
import { createKTVerifier } from '@proton/key-transparency/lib';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { CacheType } from '@proton/redux-utilities';
import {
    type SetupForwardingParameters,
    setupForwarding,
    updateForwarding,
    updateForwardingFilter,
} from '@proton/shared/lib/api/forwardings';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import { RECIPIENT_TYPES } from '@proton/shared/lib/constants';
import { getAddressFlagsData } from '@proton/shared/lib/helpers/address';
import { ForwardingType } from '@proton/shared/lib/interfaces';
import type { GetPublicKeysForInbox } from '@proton/shared/lib/interfaces/hooks/GetPublicKeysForInbox';
import {
    getActiveAddressKeys,
    getEmailFromKey,
    getPrimaryActiveAddressKeyForEncryption,
} from '@proton/shared/lib/keys';

import type { ForwardModalKeyState, ForwardModalState } from './ForwardModalInterface';

export const editFilter = ({
    filterID,
    filter: { email, conditions, statement, version },
}: {
    filterID: string;
    filter: Parameters<typeof getSieveTree>[0];
}): ThunkAction<Promise<void>, DomainsState & OrganizationState, ProtonThunkArguments, UnknownAction> => {
    return async (dispatch, getState, extra) => {
        const silentApi = getSilentApi(extra.api);

        await silentApi(
            updateForwardingFilter(
                filterID,
                getSieveTree({
                    conditions,
                    statement,
                    email,
                }),
                version || 2
            )
        );

        await extra.eventManager.call();
    };
};

export const initForwardingSetup = ({
    // We take the addressID instead of the address itself since the latter is potentially
    // stale since it's getting modified by these actions and is called in succession
    forwarderAddressID,
    email,
    getPublicKeysForInbox,
}: {
    forwarderAddressID: string;
    email: string;
    getPublicKeysForInbox: GetPublicKeysForInbox;
}): ThunkAction<
    Promise<{
        keyState: ForwardModalKeyState;
        modelState: Pick<ForwardModalState, 'isExternal' | 'isInternal' | 'forwardeeEmail'>;
    }>,
    AddressKeysState,
    ProtonThunkArguments,
    UnknownAction
> => {
    return async (dispatch) => {
        const [forwarderAddressKeys, forwardeeKeysConfig] = await Promise.all([
            dispatch(addressKeysThunk({ addressID: forwarderAddressID })),
            getPublicKeysForInbox({ email, lifetime: 0 }),
        ]);

        // Abort the setup if e.g. the given address is internal but does not exist
        const apiErrors = forwardeeKeysConfig.Errors || [];
        if (apiErrors.length > 0) {
            throw new Error(apiErrors[0]);
        }

        const forwarderAddress = (await dispatch(addressesThunk())).find(
            (address) => forwarderAddressID === address.ID
        );
        if (!forwarderAddress) {
            throw new Error('Address deleted');
        }
        const activeKeysByVersion = await getActiveAddressKeys(forwarderAddress.SignedKeyList, forwarderAddressKeys);
        const maybeV6ForwarderEncryptionKey = getPrimaryActiveAddressKeyForEncryption(activeKeysByVersion, true);
        const v4ForwarderEncryptionKey = getPrimaryActiveAddressKeyForEncryption(activeKeysByVersion, false);

        const forwarderPrimaryKeysInfo = {
            v4: {
                ID: v4ForwarderEncryptionKey.ID,
                supportsE2EEForwarding: await CryptoProxy.doesKeySupportE2EEForwarding({
                    forwarderKey: v4ForwarderEncryptionKey.privateKey,
                }),
            },
            v6:
                maybeV6ForwarderEncryptionKey.privateKey.getVersion() === 6
                    ? {
                          ID: maybeV6ForwarderEncryptionKey.ID,
                          supportsE2EEForwarding: false as const,
                      }
                    : undefined,
        };

        const isInternal = forwardeeKeysConfig.RecipientType === RECIPIENT_TYPES.TYPE_INTERNAL;
        const isExternal = forwardeeKeysConfig.RecipientType === RECIPIENT_TYPES.TYPE_EXTERNAL;
        let forwardeePublicKey: PublicKeyReference | undefined;
        let forwardeeEmailFromPublicKey: string | undefined;

        if (isInternal) {
            // While forwarding could be setup with generic catch-all addresses, we disallow this as the catch-all address case is triggered
            // if the forwardee is a private subuser who has yet to login (i.e.has missing keys).
            // In such case, the admin public keys are temporarily returned instead, meaning that E2EE forwarding will be (permanently) setup with the admin, rather
            // than the subuser, which is undesirable.
            if (forwardeeKeysConfig.isCatchAll) {
                throw new Error('This address cannot be used as forwarding recipient');
            }
            forwardeePublicKey = forwardeeKeysConfig.publicKeys[0].publicKey;
            forwardeeEmailFromPublicKey = getEmailFromKey(forwardeePublicKey);
        }

        return {
            keyState: {
                forwarderPrimaryKeysInfo,
                forwardeePublicKey,
            },
            modelState: {
                forwardeeEmail: forwardeeEmailFromPublicKey || email,
                isExternal,
                isInternal,
            },
        };
    };
};
export const finalizeForwardingSetup = ({
    // We take the addressID instead of the address itself since the latter is potentially
    // stale since it's getting modified by these actions and is called in succession
    forwarderAddressID,
    filterID,
    filter,
    keyState,
    isReEnablingForwarding,
    isInternal,
    isExternal,
}: {
    forwarderAddressID: string;
    filterID: string | undefined;
    keyState: ForwardModalKeyState;
    filter: Parameters<typeof getSieveTree>[0];
    isReEnablingForwarding: boolean | undefined;
    isInternal: boolean | undefined;
    isExternal: boolean | undefined;
}): ThunkAction<Promise<void>, AddressKeysState & KtState, ProtonThunkArguments, UnknownAction> => {
    return async (dispatch, getState, extra) => {
        const { email, version, conditions, statement } = filter;

        const forwarderAddress = (await dispatch(addressesThunk())).find(
            (address) => forwarderAddressID === address.ID
        );
        if (!forwarderAddress) {
            throw new Error('Address deleted');
        }

        const setupForwardingParams: Omit<SetupForwardingParameters, 'Tree' /* added later */> = {
            ForwarderAddressID: forwarderAddress.ID,
            ForwardeeEmail: email,
            Type: isInternal ? ForwardingType.InternalEncrypted : ForwardingType.ExternalUnencrypted,
            Version: version || 2,
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
                [{ email, name: email }],
                keyState.forwardeePublicKey
            );

            const e2eeForwardingParams = {
                ForwardeePrivateKey: forwardeeKey,
                ActivationToken: activationToken,
                ProxyInstances: proxyInstances,
            };

            await silentApi(
                isReEnablingForwarding && filterID
                    ? updateForwarding({
                          ID: filterID,
                          ...e2eeForwardingParams,
                      })
                    : setupForwarding({
                          ...setupForwardingParams,
                          Tree: getSieveTree({
                              conditions,
                              statement,
                              email,
                          }),
                          ...e2eeForwardingParams,
                      })
            );
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

            await silentApi(
                setupForwarding({
                    ...setupForwardingParams,
                    Tree: getSieveTree({
                        conditions,
                        statement,
                        email,
                    }),
                })
            );
        }

        await extra.eventManager.call();
    };
};

export const fixupPrimaryKeyV6 = ({
    // We take the addressID instead of the address itself since the latter is potentially
    // stale since it's getting modified by these actions and is called in succession
    forwarderAddressID,
    keyState,
}: {
    forwarderAddressID: string;
    keyState: ForwardModalKeyState;
}): ThunkAction<
    Promise<{
        keyState: ForwardModalKeyState;
    }>,
    AddressKeysState & KtState,
    ProtonThunkArguments,
    UnknownAction
> => {
    return async (dispatch, getState, extra) => {
        if (!keyState.forwarderPrimaryKeysInfo?.v6) {
            throw new Error('Missing primary key info');
        }

        const silentApi = getSilentApi(extra.api);

        const ktVerifier = createKTVerifier({
            ktActivation: dispatch(getKTActivation()),
            api: silentApi,
            config: extra.config,
        });

        const forwarderAddress = (await dispatch(addressesThunk())).find(
            (address) => forwarderAddressID === address.ID
        );
        if (!forwarderAddress) {
            throw new Error('Address deleted');
        }

        const forwarderAddressKeys = await dispatch(addressKeysThunk({ addressID: forwarderAddressID }));
        await handleUnsetV6PrimaryKey({
            api: silentApi,
            ID: keyState.forwarderPrimaryKeysInfo.v6.ID,
            forwarderAddress,
            addressKeys: forwarderAddressKeys,
            User: await dispatch(userThunk()),
            userKeys: await dispatch(userKeysThunk()),
            dispatch,
            ktVerifier,
        });

        // force re-fetch of addresses and address keys:
        // NB: this currently invalidates all address key references.
        await dispatch(addressesThunk({ cache: CacheType.None }));

        return {
            keyState: {
                ...keyState,
                forwarderPrimaryKeysInfo: {
                    ...keyState.forwarderPrimaryKeysInfo,
                    v6: undefined,
                },
            },
        };
    };
};

export const fixupUnsupportedPrimaryKeyV4 = ({
    // We take the addressID instead of the address itself since the latter is potentially
    // stale since it's getting modified by these actions and is called in succession
    forwarderAddressID,
    keyState,
}: {
    forwarderAddressID: string;
    keyState: ForwardModalKeyState;
}): ThunkAction<
    Promise<{
        keyState: ForwardModalKeyState;
    }>,
    AddressKeysState & KtState,
    ProtonThunkArguments,
    UnknownAction
> => {
    return async (dispatch, getState, extra) => {
        if (!keyState.forwarderPrimaryKeysInfo) {
            throw new Error('Missing primary key info');
        }

        if (keyState.forwarderPrimaryKeysInfo.v4.supportsE2EEForwarding) {
            throw new Error('Primary key already supports forwarding');
        }

        const silentApi = getSilentApi(extra.api);
        const addresses = await dispatch(addressesThunk());

        const forwarderAddress = addresses.find((address) => forwarderAddressID === address.ID);
        if (!forwarderAddress) {
            throw new Error('Address deleted');
        }

        const ktVerifier = createKTVerifier({
            ktActivation: dispatch(getKTActivation()),
            api: silentApi,
            config: extra.config,
        });

        const forwarderAddressKeys = await dispatch(addressKeysThunk({ addressID: forwarderAddressID }));
        const newKey = await generateNewE2EEForwardingCompatibleAddressKey({
            api: silentApi,
            forwarderAddress,
            addresses,
            addressKeys: forwarderAddressKeys,
            User: await dispatch(userThunk()),
            userKeys: await dispatch(userKeysThunk()),
            ktVerifier,
            authentication: extra.authentication,
        });

        // force re-fetch of addresses and address keys:
        // NB: this currently invalidates all address key references.
        await dispatch(addressesThunk({ cache: CacheType.None }));

        return {
            keyState: {
                ...keyState,
                forwarderPrimaryKeysInfo: {
                    ...keyState.forwarderPrimaryKeysInfo,
                    v4: {
                        ID: newKey.ID,
                        supportsE2EEForwarding: true,
                    },
                },
            },
        };
    };
};
