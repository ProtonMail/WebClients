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
