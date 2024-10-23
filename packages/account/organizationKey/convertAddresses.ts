import type { UnknownAction } from '@reduxjs/toolkit';
import type { ThunkAction } from 'redux-thunk';

import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { CacheType } from '@proton/redux-utilities';
import { addressType } from '@proton/shared/lib/api/addresses';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import { ADDRESS_TYPE, MEMBER_PRIVATE } from '@proton/shared/lib/constants';
import { getEmailParts } from '@proton/shared/lib/helpers/email';
import type {
    Address,
    Api,
    DecryptedAddressKey,
    DecryptedKey,
    Domain,
    EnhancedMember,
    KeyTransparencyCommit,
    KeyTransparencyVerify,
    PartialMemberAddress,
} from '@proton/shared/lib/interfaces';
import { VERIFY_STATE } from '@proton/shared/lib/interfaces';
import {
    clearExternalFlags,
    getActiveKeys,
    getMemberKeys,
    getNormalizedActiveKeys,
    getSignedKeyListWithDeferredPublish,
} from '@proton/shared/lib/keys';

import { type AddressKeysState, addressKeysThunk } from '../addressKeys';
import { type AddressesState, addressesThunk } from '../addresses';
import type { DomainsState } from '../domains';
import { type MembersState, getMemberAddresses, membersThunk } from '../members';
import { type UserKeysState, userKeysThunk } from '../userKeys';
import { type OrganizationKeyState, organizationKeyThunk } from './index';

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

const externalAddressFilter = (address: Pick<Address, 'Type'>) => {
    return address.Type === ADDRESS_TYPE.TYPE_EXTERNAL;
};

const getVerifiedMailDomains = (domains: Domain[]) => {
    return domains.reduce<{ [domain: string]: Domain }>((acc, domain) => {
        if (domain.Flags['mail-intent'] && domain.VerifyState === VERIFY_STATE.VERIFY_STATE_GOOD) {
            acc[domain.DomainName] = domain;
        }
        return acc;
    }, {});
};

export const convertMemberExternalAddresses = ({
    domains,
    keyTransparencyVerify,
    keyTransparencyCommit,
}: {
    domains?: Domain[];
    keyTransparencyVerify: KeyTransparencyVerify;
    keyTransparencyCommit: KeyTransparencyCommit;
}): ThunkAction<
    Promise<void>,
    OrganizationKeyState & MembersState & DomainsState & UserKeysState,
    ProtonThunkArguments,
    UnknownAction
> => {
    return async (dispatch, _, extra) => {
        if (!domains?.length) {
            return;
        }

        const verifiedMailDomainsMap = getVerifiedMailDomains(domains);
        if (!Object.keys(verifiedMailDomainsMap).length) {
            return;
        }

        const [members, organizationKey] = await Promise.all([
            dispatch(membersThunk()),
            dispatch(organizationKeyThunk()),
        ]);

        if (!organizationKey.privateKey) {
            return;
        }

        const membersWithExternalAddresses = members.reduce<
            {
                member: EnhancedMember;
                memberAddresses: PartialMemberAddress[];
            }[]
        >((acc, member) => {
            const memberAddresses = member.Addresses?.filter((address) => {
                const [, domain] = getEmailParts(address.Email);
                return externalAddressFilter(address) && verifiedMailDomainsMap[domain];
            });
            const adminAccess = member.Private === MEMBER_PRIVATE.READABLE;
            if (adminAccess && memberAddresses?.length) {
                acc.push({ member, memberAddresses });
            }
            return acc;
        }, []);

        if (!membersWithExternalAddresses.length) {
            return;
        }

        const silentApi = getSilentApi(extra.api);

        const result = await Promise.all(
            membersWithExternalAddresses.map(async ({ member, memberAddresses }) => {
                const fullMemberAddresses = await dispatch(getMemberAddresses({ member, retry: true }));
                const memberKeys = await getMemberKeys({
                    member,
                    memberAddresses: fullMemberAddresses,
                    organizationKey,
                });
                const memberAddressKeysMap = memberKeys.memberAddressesKeys.reduce<{
                    [id: string]: { keys: DecryptedAddressKey[]; address: Address } | undefined;
                }>((acc, { keys, address }) => {
                    acc[address.ID] = { keys, address };
                    return acc;
                }, {});
                return Promise.all(
                    memberAddresses.map(async (memberAddress) => {
                        const result = memberAddressKeysMap[memberAddress.ID];
                        if (!result) {
                            return false;
                        }
                        try {
                            await convertToInternalAddress({
                                address: result.address,
                                keys: result.keys,
                                api: silentApi,
                                keyTransparencyVerify,
                            });
                            return true;
                        } catch {
                            return false;
                        }
                    })
                );
            })
        );

        if (!result.flat().some((value) => value === true)) {
            return;
        }

        const userKeys = await dispatch(userKeysThunk());
        await keyTransparencyCommit(userKeys);
        await dispatch(membersThunk({ cache: CacheType.None }));
    };
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
        const domainsToConvertMap = getVerifiedMailDomains(domains);
        if (!Object.keys(domainsToConvertMap).length) {
            return;
        }

        const addresses = await dispatch(addressesThunk());
        const externalAddresses = addresses.filter((address) => {
            const [, domain] = getEmailParts(address.Email);
            return externalAddressFilter(address) && domainsToConvertMap[domain];
        });
        if (!externalAddresses.length) {
            return;
        }

        const silentApi = getSilentApi(extra.api);

        const result = await Promise.all(
            externalAddresses.map(async (externalAddress) => {
                try {
                    await convertToInternalAddress({
                        address: externalAddress,
                        keys: await dispatch(addressKeysThunk({ addressID: externalAddress.ID })),
                        api: silentApi,
                        keyTransparencyVerify,
                    });
                    return true;
                } catch {
                    return false;
                }
            })
        );

        if (!result.length) {
            return;
        }

        const userKeys = await dispatch(userKeysThunk());
        await keyTransparencyCommit(userKeys);
        await dispatch(addressesThunk({ cache: CacheType.None }));
    };
};
