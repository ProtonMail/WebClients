import type { MaybeNull, PatMonitorListEntryOutput, PersonalAccessTokenShareResponse } from '@proton/pass/types';

/**
 * ======================================
 * Proton Account specific response types
 * ======================================
 */

export type PersonalAccessTokenFlags = { PassAgent: boolean };

export type PersonalAccessToken = {
    PersonalAccessTokenID: string;
    Name: string;
    PersonalAccessTokenKey: string;
    ExpireTime: number;
    CreateTime: number;
    ModifyTime: number;
    TokenMask: number;
    Token: string;
    Flags?: MaybeNull<PersonalAccessTokenFlags>;
};

export type PersonalAccessTokenWithKey = { data: PersonalAccessToken; rawPatKey: Uint8Array<ArrayBuffer> };

export type CreatePersonalAccessTokenPayload = {
    Name: string;
    Products: string[];
    PersonalAccessTokenKey: string;
    ExpireTime: number;
    Flags?: MaybeNull<PersonalAccessTokenFlags>;
};

export type CreatePersonalAccessTokenResponse = {
    Code: number;
    PersonalAccessToken: PersonalAccessToken;
};

export type ListPersonalAccessTokensResponse = {
    Code: number;
    PersonalAccessTokens: {
        PersonalAccessTokens: PersonalAccessToken[];
        Total: number;
        LastToken: MaybeNull<string>;
    };
};

/**  ===================================== */

export type DecodedPatMonitorPayload =
    | { kind: 'agent-action'; reason: string; vaultName: string; itemName: string; folderName: string }
    /** Payload was present but the protobuf had a oneof variant we don't
     * recognise (eg: server added a new event type). */
    | { kind: 'unknown' }
    /** Payload was present but decryption / proto-decode threw. */
    | { kind: 'decode-error'; error: string };

/** Server record + the decoded payload (when there is one + decryption
 * succeeded). The component-side state stores this shape. */
export type DecodedPatMonitorRecord = PatMonitorListEntryOutput & {
    decodedPayload: MaybeNull<DecodedPatMonitorPayload>;
};

export type CreateAccessTokenIntent = {
    name: string;
    expirationMinutes: number;
    isAgent: boolean;
    shareIds: string[];
};

export type CreateAccessTokenSuccess = {
    pat: PersonalAccessToken;
    /** One-shot env-var (`<token>::<b64url(raw-key)>`) */
    envVar: string;
    isAgent: boolean;
};

export type UpdateAccessTokenAccessIntent = {
    tokenId: string;
    /** The complete set of vault `shareId` values the token
     * should have access to after the update. */
    shareIds: string[];
};

export type AccessTokenAccessGrants = {
    tokenId: string;
    grants: PersonalAccessTokenShareResponse[];
};

export type GetAccessTokenActionsIntent = {
    tokenId: string;
    since?: string;
};

export type AccessTokenActionsPage = {
    tokenId: string;
    records: DecodedPatMonitorRecord[];
    nextSince: MaybeNull<string>;
    append: boolean;
};
