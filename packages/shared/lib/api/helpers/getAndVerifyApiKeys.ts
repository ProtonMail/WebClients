import { CryptoProxy } from '@proton/crypto';
import isTruthy from '@proton/utils/isTruthy';

import type { API_KEY_SOURCE } from '../../constants';
import type {
    Api,
    FetchedSignedKeyList,
    KTUserContext,
    KeyTransparencyVerificationResult,
    ProcessedApiKey,
    VerifyOutboundPublicKeys,
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
}

const importKeys = async (keys: ApiAddressKey[], checkCompatibility?: boolean): Promise<ProcessedApiKey[]> => {
    const promises = await Promise.all(
        keys.map(async ({ PublicKey: armoredKey, Flags, Source }) => {
            const publicKey = await CryptoProxy.importPublicKey({ armoredKey, checkCompatibility }).catch(() => null);

            if (!publicKey) {
                return null;
            }

            return {
                armoredKey,
                flags: Flags,
                publicKey: publicKey,
                source: Source,
            };
        })
    );

    return promises.filter(isTruthy);
};

export const getAndVerifyApiKeys = async ({
    api,
    email,
    internalKeysOnly,
    verifyOutboundPublicKeys,
    skipVerificationOfExternalDomains = false,
    silence = false,
    noCache = false,
    userContext,
}: {
    api: Api;
    email: string;
    internalKeysOnly: boolean;
    /** KT verification function, or `null` for legacy use-case where KT is disabled */
    verifyOutboundPublicKeys: VerifyOutboundPublicKeys | null;
    userContext?: KTUserContext;
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
    const unverifiedKeys = Unverified ? await importKeys(Unverified.Keys, true) : undefined;
    const catchAllKeys = CatchAll ? await importKeys(CatchAll.Keys) : undefined;
    const ktResult = verifyOutboundPublicKeys
        ? await verifyOutboundPublicKeys({
              userContext,
              api,
              email,
              skipVerificationOfExternalDomains,
              address: { keyList: addressKeys, signedKeyList: Address.SignedKeyList },
              catchAll: CatchAll ? { keyList: catchAllKeys!, signedKeyList: CatchAll.SignedKeyList } : undefined,
          })
        : {};
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
