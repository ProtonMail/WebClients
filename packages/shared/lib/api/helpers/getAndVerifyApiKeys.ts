import { CryptoProxy } from '@proton/crypto';
import isTruthy from '@proton/utils/isTruthy';

import {
    Api,
    ApiAddressKey,
    ApiAddressKeySource,
    FetchedSignedKeyList,
    KeyTransparencyVerificationResult,
    ProcessedApiAddressKey,
    VerifyOutboundPublicKeys,
} from '../../interfaces';
import { getAllPublicKeys } from '../keys';

export interface ApiKeysWithKTStatus {
    addressKeys: ProcessedApiAddressKey[];
    addressKTResult?: KeyTransparencyVerificationResult;
    catchAllKeys?: ProcessedApiAddressKey[];
    catchAllKTResult?: KeyTransparencyVerificationResult;
    unverifiedKeys?: ProcessedApiAddressKey[];
    hasValidProtonMX?: boolean;
    Code?: number;
    Warnings?: string[];
}

const getApiKeySource = (source: number): ApiAddressKeySource => {
    switch (source) {
        case 0:
            return ApiAddressKeySource.PROTON;
        case 1:
            return ApiAddressKeySource.WKD;
        default:
            return ApiAddressKeySource.UNKNOWN;
    }
};

const importKeys = async (keys: ApiAddressKey[], checkCompatibility?: boolean): Promise<ProcessedApiAddressKey[]> => {
    const promises = await Promise.all(
        keys.map(async ({ PublicKey, Flags, Source }) => {
            const publicKeyRef = await CryptoProxy.importPublicKey({ armoredKey: PublicKey, checkCompatibility }).catch(
                () => null
            );

            if (!publicKeyRef) {return null;}

            return {
                armoredPublicKey: PublicKey,
                flags: Flags,
                publicKeyRef,
                source: getApiKeySource(Source),
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
}: {
    api: Api;
    email: string;
    internalKeysOnly: boolean;
    /** KT verification function, or `null` for legacy use-case where KT is disabled */
    verifyOutboundPublicKeys: VerifyOutboundPublicKeys | null;
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
        ? await verifyOutboundPublicKeys(
              email,
              skipVerificationOfExternalDomains,
              { keyList: addressKeys, signedKeyList: Address.SignedKeyList },
              CatchAll ? { keyList: catchAllKeys!, signedKeyList: CatchAll.SignedKeyList } : undefined
          )
        : {};
    return {
        addressKeys,
        catchAllKeys,
        unverifiedKeys,
        hasValidProtonMX: ProtonMX,
        ...rest,
        ...ktResult,
    };
};
