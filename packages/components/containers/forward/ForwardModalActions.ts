import type { UnknownAction } from '@reduxjs/toolkit';
import type { ThunkAction } from 'redux-thunk';

import { type AddressKeysState, addressKeysThunk } from '@proton/account/addressKeys';
import { addressesThunk } from '@proton/account/addresses';
import type { KtState } from '@proton/account/kt';
import { getKTActivation } from '@proton/account/kt/actions';
import { getPublicKeysForInboxThunk } from '@proton/account/publicKeys/publicKeysForInbox';
import { userThunk } from '@proton/account/user';
import { type UserKeysState, userKeysThunk } from '@proton/account/userKeys';
import { CryptoProxy, type PublicKeyReference } from '@proton/crypto';
import { createKTVerifier } from '@proton/key-transparency/helpers';
import type { ForwardModalKeyState } from '@proton/mail/store/forwarding/outgoingForwardingActions';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { CacheType } from '@proton/redux-utilities';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import { RECIPIENT_TYPES } from '@proton/shared/lib/constants';
import {
    getActiveAddressKeys,
    getEmailFromKey,
    getPrimaryActiveAddressKeyForEncryption,
} from '@proton/shared/lib/keys';
import {
    generateNewE2EEForwardingCompatibleAddressKey,
    handleUnsetV6PrimaryKey,
} from '@proton/shared/lib/keys/forward/keyHelpers';

import type { ForwardModalState } from './ForwardModalInterface';

export const initForwardingSetup = ({
    // We take the addressID instead of the address itself since the latter is potentially
    // stale since it's getting modified by these actions and is called in succession
    forwarderAddressID,
    email,
}: {
    forwarderAddressID: string;
    email: string;
}): ThunkAction<
    Promise<{
        keyState: ForwardModalKeyState;
        modelState: Pick<ForwardModalState, 'isExternal' | 'isInternal' | 'forwardeeEmail'>;
    }>,
    KtState & AddressKeysState & UserKeysState,
    ProtonThunkArguments,
    UnknownAction
> => {
    return async (dispatch) => {
        const [forwarderAddressKeys, forwardeeKeysConfig] = await Promise.all([
            dispatch(addressKeysThunk({ addressID: forwarderAddressID })),
            dispatch(getPublicKeysForInboxThunk({ email, lifetime: 0 })),
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

        const [ktActivation, forwarderAddressKeys, user, userKeys] = await Promise.all([
            dispatch(getKTActivation()),
            dispatch(addressKeysThunk({ addressID: forwarderAddressID })),
            dispatch(userThunk()),
            dispatch(userKeysThunk()),
        ]);
        await handleUnsetV6PrimaryKey({
            api: silentApi,
            ID: keyState.forwarderPrimaryKeysInfo.v6.ID,
            forwarderAddress,
            addressKeys: forwarderAddressKeys,
            User: user,
            userKeys,
            ktVerifier,
            ktActivation,
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

        const [forwarderAddressKeys, user, userKeys] = await Promise.all([
            dispatch(addressKeysThunk({ addressID: forwarderAddressID })),
            dispatch(userThunk()),
            dispatch(userKeysThunk()),
        ]);
        const keyPassword = extra.authentication.getPassword();
        const newKey = await generateNewE2EEForwardingCompatibleAddressKey({
            api: silentApi,
            forwarderAddress,
            addresses,
            addressKeys: forwarderAddressKeys,
            User: user,
            userKeys,
            ktVerifier,
            keyPassword,
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
