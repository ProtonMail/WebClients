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
    Token?: string;
    Flags?: PersonalAccessTokenFlags | null;
}

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

/** Summary of a single access grant returned by GET /access. `ShareID` is the
 * PAT-scoped share that carries this grant; `VaultID` identifies the underlying
 * vault (use this to correlate to the user's own VaultShareItem.vaultId);
 * `ParentShareID` is the user's share that was the source of the grant. */
export interface PersonalAccessTokenAccessGrant {
    ShareID: string;
    VaultID: string;
    TargetID?: string;
    TargetType?: number;
    ShareRoleID?: string;
    ParentShareID?: string;
    CreateTime?: number;
    ExpireTime?: number;
}

export interface ListPersonalAccessTokenAccessResponse {
    Code: number;
    Shares: PersonalAccessTokenAccessGrant[];
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
