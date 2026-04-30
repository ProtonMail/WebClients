export interface PersonalAccessTokenFlags {
    PassAgent: boolean;
}

export interface PersonalAccessToken {
    PersonalAccessTokenID: string;
    Name: string;
    PersonalAccessTokenKey: string;
    ExpireTime: number;
    CreateTime: number;
    ModifyTime: number;
    TokenMask: number;
    Token: string;
    Flags?: PersonalAccessTokenFlags | null;
}

export type PersonalAccessTokenWithKey = { data: PersonalAccessToken; rawPatKey: Uint8Array<ArrayBuffer> };

export interface CreatePersonalAccessTokenPayload {
    Name: string;
    Products: string[];
    PersonalAccessTokenKey: string;
    ExpireTime: number;
    Flags?: PersonalAccessTokenFlags | null;
}

export interface CreatePersonalAccessTokenResponse {
    Code: number;
    PersonalAccessToken: PersonalAccessToken;
}

export interface ListPersonalAccessTokensResponse {
    Code: number;
    PersonalAccessTokens: {
        PersonalAccessTokens: PersonalAccessToken[];
        Total: number;
        LastToken: string | null;
    };
}

/** Per-rotation wrapped share key — the vault's raw share-key bytes encrypted
 * with the PAT's symmetric key using AES-GCM, AAD = "sharekey". */
export interface PersonalAccessTokenShareKey {
    KeyRotation: number;
    Key: string;
}

export interface GrantPersonalAccessTokenAccessPayload {
    ShareID: string;
    /** Only set for item-share grants; omitted for vault grants. */
    TargetID?: string;
    /** 1 = Vault, 2 = Item (matches ShareType). */
    TargetType: number;
    /** '1' = Manager, '2' = Write, '3' = Read (matches ShareRole). */
    ShareRoleID: string;
    Keys: PersonalAccessTokenShareKey[];
}

/** FIXME: check if this type and others should already be defined in packages/pass/types/api/pass.ts */
export interface PersonalAccessTokenAccessGrant {
    ShareID: string;
    ParentShareID: string;
    VaultID: string;
    TargetID?: string;
    TargetType?: number;
    ShareRoleID?: string;
    CreateTime?: number;
    ExpireTime?: number;
}

export interface ListPersonalAccessTokenAccessResponse {
    Code: number;
    Shares: PersonalAccessTokenAccessGrant[];
}

/** Future-proofing note: BE may emit codes outside this subset for
 * future event types, so the `Action` field on `PatMonitorRecord` type below
 * stays `number` instead of the enum, so unmapped codes degrade gracefully
 * to a generic label. */
export enum PAT_EVENT_TYPE {
    ITEM_CREATE = 20,
    ITEM_UPDATE = 21,
    ITEM_TRASH = 22,
    ITEM_UNTRASH = 23,
    ITEM_SOFT_DELETE = 24,
    ITEM_READ = 31,
    PERSONAL_ACCESS_TOKEN_ACCESS_GRANTED = 160,
}

/** A single audit record of an agent action made via a PAT. `Action` is the
 * server-defined `EventType` enum (numeric); `Payload` is a base64-encoded
 * AES-GCM ciphertext (AAD = "proton.pass.payload") that decrypts to a
 * serialized `ActionPayload` protobuf — the saga handles decryption and
 * surfaces the decoded form via `decodedPayload`. */
export interface PatMonitorRecord {
    PatMonitorRecordID: string;
    VaultID: string;
    ObjectID?: string;
    Action: number;
    Payload?: string;
    ActionTime: number;
}

export type DecodedPatMonitorPayload =
    | { kind: 'agent-action'; reason: string; vaultName: string; itemName: string; folderName: string }
    /** Payload was present but the protobuf had a oneof variant we don't
     * recognise (e.g. server added a new event type). */
    | { kind: 'unknown' }
    /** Payload was present but decryption / proto-decode threw. */
    | { kind: 'decode-error'; error: string };

/** Server record + the decoded payload (when there is one + decryption
 * succeeded). The component-side state stores this shape. */
export type DecodedPatMonitorRecord = PatMonitorRecord & {
    decodedPayload: DecodedPatMonitorPayload | null;
};

export interface ListPatMonitorResponse {
    Code: number;
    Actions: {
        Records: PatMonitorRecord[];
        /** Cursor — pass as `Since` query-param to fetch the next page.
         * Null when there are no more records. */
        NextSince: string | null;
    };
}
