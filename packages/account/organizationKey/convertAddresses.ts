import type { UnknownAction } from '@reduxjs/toolkit';
import type { ThunkAction } from 'redux-thunk';

import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { addressType } from '@proton/shared/lib/api/addresses';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import { ADDRESS_TYPE } from '@proton/shared/lib/constants';
import { getEmailParts } from '@proton/shared/lib/helpers/email';
import type {
    Address,
    Api,
    DecryptedKey,
    Domain,
    KeyTransparencyCommit,
    KeyTransparencyVerify,
} from '@proton/shared/lib/interfaces';
import { VERIFY_STATE } from '@proton/shared/lib/interfaces';
import {
    clearExternalFlags,
    getActiveKeys,
    getNormalizedActiveKeys,
    getSignedKeyListWithDeferredPublish,
} from '@proton/shared/lib/keys';

import { type AddressKeysState, addressKeysThunk } from '../addressKeys';
import type { AddressesState } from '../addresses';
import { addressesThunk } from '../addresses';
import type { DomainsState } from '../domains';
import { type UserKeysState, userKeysThunk } from '../userKeys';

const convertToInternalAddress = async ({
    address,
    keys,
    api,
    keyTransparencyVerify,
}: {
    address: Address;
    keys: DecryptedKey[];
    api: Api;
    keyTransparencyVerify: KeyTransparencyVerify;
}) => {
    const activeKeys = await getActiveKeys(address, address.SignedKeyList, address.Keys, keys);
    const internalAddress = {
        ...address,
        // Reset type to an internal address with a custom domain
        Type: ADDRESS_TYPE.TYPE_CUSTOM_DOMAIN,
    };
    const [signedKeyList, onSKLPublishSuccess] = await getSignedKeyListWithDeferredPublish(
        getNormalizedActiveKeys(internalAddress, activeKeys).map((key) => {
            return {
                ...key,
                flags: clearExternalFlags(key.flags),
            };
        }),
        address,
        keyTransparencyVerify
    );
    await api(
        addressType(address.ID, {
            Type: internalAddress.Type,
            SignedKeyList: signedKeyList,
        })
    );
    await onSKLPublishSuccess();
};

export const convertExternalAddresses = ({
    domains,
    keyTransparencyVerify,
    keyTransparencyCommit,
}: {
    domains?: Domain[];
    keyTransparencyVerify: KeyTransparencyVerify;
    keyTransparencyCommit: KeyTransparencyCommit;
}): ThunkAction<
    Promise<void>,
    DomainsState & AddressesState & AddressKeysState & UserKeysState,
    ProtonThunkArguments,
    UnknownAction
> => {
    return async (dispatch, _, extra) => {
        if (!domains?.length) {
            return;
        }

        const addresses = await dispatch(addressesThunk());
        const externalAddresses = addresses.filter((address) => address.Type === ADDRESS_TYPE.TYPE_EXTERNAL);
        if (!externalAddresses.length) {
            return;
        }

        const externalAddressesDomainsMap = externalAddresses.reduce<{
            [key: string]: Address[] | undefined;
        }>((acc, externalAddress) => {
            const [, domain] = getEmailParts(externalAddress.Email);
            if (!acc[domain]) {
                acc[domain] = [];
            }
            acc[domain].push(externalAddress);
            return acc;
        }, {});

        const domainsToConvert = domains.filter((domain) => {
            const externalAddressesForThatDomain = externalAddressesDomainsMap[domain.DomainName] || [];
            return domain.VerifyState === VERIFY_STATE.VERIFY_STATE_GOOD && externalAddressesForThatDomain.length >= 1;
        });

        if (!domainsToConvert.length) {
            return;
        }

        const silentApi = getSilentApi(extra.api);

        const run = async (externalAddresses: Address[] | undefined) => {
            if (!externalAddresses?.length) {
                return;
            }
            await Promise.all(
                externalAddresses.map(async (externalAddress) => {
                    return convertToInternalAddress({
                        address: externalAddress,
                        keys: await dispatch(addressKeysThunk({ addressID: externalAddress.ID })),
                        api: silentApi,
                        keyTransparencyVerify,
                    });
                })
            );
        };

        await Promise.all(domainsToConvert.map((domain) => run(externalAddressesDomainsMap[domain.DomainName])));

        const userKeys = await dispatch(userKeysThunk());
        await keyTransparencyCommit(userKeys);
        await extra.eventManager.call();
    };
};
