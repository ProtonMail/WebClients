import { KTPublicKeyStatus } from '@proton/key-transparency/lib';

import { Api, FetchedSignedKeyList, VerifyOutboundPublicKeys } from '../../interfaces';
import { getAllPublicKeys } from '../keys';

export enum ApiKeySource {
    PROTON,
    WKD,
    UNKNOWN,
}

export interface KeyWithFlags {
    armoredKey: string;
    flags: number;
}

export interface KeyWithFlagsAndSource extends KeyWithFlags {
    source: ApiKeySource;
}

export interface ApiKeysWithKTStatus {
    addressKeys: KeyWithFlags[];
    addressKTStatus?: KTPublicKeyStatus;
    catchAllKeys?: KeyWithFlags[];
    catchAllKTStatus?: KTPublicKeyStatus;
    unverifiedKeys?: KeyWithFlagsAndSource[];
    Code?: number;
    Warnings?: string[];
}

const getApiKeySource = (source: number): ApiKeySource => {
    switch (source) {
        case 0:
            return ApiKeySource.PROTON;
        case 1:
            return ApiKeySource.WKD;
        default:
            return ApiKeySource.UNKNOWN;
    }
};

export const getAndVerifyApiKeys = async (
    api: Api,
    Email: string,
    keysIntendedForEmail: boolean,
    verifyOutboundPublicKeys: VerifyOutboundPublicKeys,
    silence = false,
    noCache = false
): Promise<ApiKeysWithKTStatus> => {
    const config: any = { ...getAllPublicKeys({ Email, InternalOnly: keysIntendedForEmail ? 0 : 1 }), silence };
    if (noCache) {
        config.cache = 'no-cache';
    }
    const { Address, CatchAll, Unverified, ...rest } = await api<{
        Address: {
            Keys: { PublicKey: string; Flags: number }[];
            SignedKeyList: FetchedSignedKeyList | null;
        };
        CatchAll:
            | {
                  Keys: { PublicKey: string; Flags: number }[];
                  SignedKeyList: FetchedSignedKeyList | null;
              }
            | undefined;
        Unverified: {
            Keys: { PublicKey: string; Flags: number; Source: number }[];
        };
        Warnings: string[];
    }>(config);
    const addressKeys = Address.Keys.map(({ PublicKey, Flags }) => {
        return { armoredKey: PublicKey, flags: Flags };
    });
    const unverifiedKeys = Unverified?.Keys.map(({ PublicKey, Flags, Source }) => {
        return { armoredKey: PublicKey, flags: Flags, source: getApiKeySource(Source) };
    });
    const catchAllKeys = CatchAll?.Keys.map(({ PublicKey, Flags }) => {
        return { armoredKey: PublicKey, flags: Flags };
    });
    let ktStatus;
    if (verifyOutboundPublicKeys) {
        ktStatus = await verifyOutboundPublicKeys(
            Email,
            keysIntendedForEmail,
            { keyList: Address.Keys, signedKeyList: Address.SignedKeyList },
            CatchAll ? { keyList: CatchAll.Keys, signedKeyList: CatchAll.SignedKeyList } : undefined
        );
    }
    return {
        addressKeys,
        addressKTStatus: ktStatus?.addressKTStatus,
        catchAllKeys,
        catchAllKTStatus: ktStatus?.catchAllKTStatus,
        unverifiedKeys,
        ...rest,
    };
};
