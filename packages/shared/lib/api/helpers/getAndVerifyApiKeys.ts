import { CryptoProxy } from '@proton/crypto';

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

const importKeys = (keys: ApiAddressKey[]): Promise<ProcessedApiAddressKey[]> => {
    return Promise.all(
        keys.map(async ({ PublicKey, Flags, Source }) => {
            return {
                armoredPublicKey: PublicKey,
                flags: Flags,
                publicKeyRef: await CryptoProxy.importPublicKey({ armoredKey: PublicKey }),
                source: getApiKeySource(Source),
            };
        })
    );
};

export const getAndVerifyApiKeys = async ({
    api,
    email,
    internalKeysOnly,
    verifyOutboundPublicKeys,
    silence = false,
    noCache = false,
}: {
    api: Api;
    email: string;
    internalKeysOnly: boolean;
    /** KT verification function, or `null` for legacy use-case where KT is disabled */
    verifyOutboundPublicKeys: VerifyOutboundPublicKeys | null;
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
    const unverifiedKeys = Unverified ? await importKeys(Unverified.Keys) : undefined;
    const catchAllKeys = CatchAll ? await importKeys(CatchAll.Keys) : undefined;
    const ktResult = verifyOutboundPublicKeys
        ? await verifyOutboundPublicKeys(
              email,
              internalKeysOnly,
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
