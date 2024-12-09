import { CryptoProxy, KeyCompatibilityLevel } from '@proton/crypto';
import { verifyOutboundPublicKeys } from '@proton/key-transparency/lib/helpers/verifyOutboundPublicKeys';
import isTruthy from '@proton/utils/isTruthy';

import type { API_KEY_SOURCE } from '../../constants';
import type {
    Api,
    FetchedSignedKeyList,
    KTUserContext,
    KeyTransparencyVerificationResult,
    ProcessedApiKey,
} from '../../interfaces';
import { getAllPublicKeys } from '../keys';

export interface ApiKeysWithKTStatus {
    Address: {
        Keys: ApiAddressKey[];
        SignedKeyList: FetchedSignedKeyList | null;
    };
    addressKeys: ProcessedApiKey[];
    addressKTResult?: KeyTransparencyVerificationResult;
    catchAllKeys?: ProcessedApiKey[];
    catchAllKTResult?: KeyTransparencyVerificationResult;
    unverifiedKeys?: ProcessedApiKey[];
    hasValidProtonMX?: boolean;
    Code?: number;
    Warnings?: string[];
}

interface ApiAddressKey {
    PublicKey: string;
    Flags: number;
    Source: API_KEY_SOURCE;
    Primary: 1 | 0;
}

const importKeys = async (
    keys: ApiAddressKey[],
    checkCompatibility?: KeyCompatibilityLevel
): Promise<ProcessedApiKey[]> => {
    const promises = await Promise.all(
        keys.map(async ({ PublicKey: armoredKey, Flags, Source, Primary }) => {
            const publicKey = await CryptoProxy.importPublicKey({ armoredKey, checkCompatibility }).catch(() => null);

            if (!publicKey) {
                return null;
            }

            return {
                armoredKey,
                flags: Flags,
                publicKey: publicKey,
                source: Source,
                primary: Primary,
            };
        })
    );

    return promises.filter(isTruthy);
};

export const getAndVerifyApiKeys = async ({
    api,
    email,
    internalKeysOnly,
    skipVerificationOfExternalDomains = false,
    silence = false,
    noCache = false,
    ktUserContext,
}: {
    api: Api;
    email: string;
    internalKeysOnly: boolean;
    ktUserContext: KTUserContext;
    /** Optimisations _only_ for apps where users with external domains do not have valid keys (e.g. Mail) */
    skipVerificationOfExternalDomains?: boolean;
    silence?: boolean;
    noCache?: boolean;
}): Promise<ApiKeysWithKTStatus> => {
    const config: any = { ...getAllPublicKeys({ Email: email, InternalOnly: internalKeysOnly ? 1 : 0 }), silence };
    if (noCache) {
        config.cache = 'no-cache';
    }
    const { Address, CatchAll, Unverified, ProtonMX, ...rest } = await api<{
        Address: {
            Keys: ApiAddressKey[];
            SignedKeyList: FetchedSignedKeyList | null;
        };
        CatchAll:
            | {
                  Keys: ApiAddressKey[];
                  SignedKeyList: FetchedSignedKeyList | null;
              }
            | undefined;
        Unverified: {
            Keys: ApiAddressKey[];
        };
        ProtonMX: boolean;
        Warnings: string[];
    }>(config);
    const addressKeys = await importKeys(Address.Keys);
    // unverified keys include WKD ones, hence we check compatibility (NB: internal users with v6 keys won't have unverified keys);
    // we can eventually accept WKD v6 keys, as long as pinning them is limited to users who have opted in v6 support.
    const unverifiedKeys = Unverified
        ? await importKeys(Unverified.Keys, KeyCompatibilityLevel.BACKWARDS_COMPATIBLE)
        : undefined;
    const catchAllKeys = CatchAll ? await importKeys(CatchAll.Keys) : undefined;
    const ktResult = await verifyOutboundPublicKeys({
        ktUserContext,
        api,
        email,
        skipVerificationOfExternalDomains,
        address: { keyList: addressKeys, signedKeyList: Address.SignedKeyList },
        catchAll: CatchAll ? { keyList: catchAllKeys!, signedKeyList: CatchAll.SignedKeyList } : undefined,
    });
    return {
        Address,
        addressKeys,
        catchAllKeys,
        unverifiedKeys,
        hasValidProtonMX: ProtonMX,
        ...rest,
        ...ktResult,
    };
};
