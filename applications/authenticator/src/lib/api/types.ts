export enum ResponseCodeSuccess {
    PROTONRESPONSECODE_1000 = 1000,
}
export type ProtonSuccess = { Code: ResponseCodeSuccess };
export type ProtonError = {
    Code: number;
    /* Error message */
    Error: string;
    /* Error description (can be an empty object) */
    Details: {};
};
export type DriveConstants = {
    BlockMaxSizeInBytes?: '5300000';
    ThumbnailMaxSizeInBytes?: '65536';
    DraftRevisionLifetimeInSec?: '14400';
    ExtendedAttributesMaxSizeInBytes?: '65535';
    UploadTokenExpirationTimeInSec?: '10800';
    DownloadTokenExpirationTimeInSec?: '1800';
};
export type AuthenticatorCreateEntryRequest = {
    AuthenticatorKeyID: Id;
    /* Base64 representation of the entry content encrypted with the AuthenticatorKey */
    Content: string;
    /* Version of the format used to encode the contents of this entry */
    ContentFormatVersion: number;
};
export type AuthenticatorCreateEntriesRequest = {
    /* List of authenticator entries to be created */
    Entries: AuthenticatorCreateEntryRequest[];
};
export type AuthenticatorEntryUpdateBulkRequest = {
    /* List of authenticator entries to be updated */
    Entries: AuthenticatorEntryUpdateWithEntryRequest[];
};
export type AuthenticatorEntryDeleteBulkInput = {
    /* List of authenticator entryIDs to be deleted */
    EntryIDs: Id[];
};
export type AuthenticatorReorderBatchRequest = {
    /* Initial position of the first entry. Starting position is 0 */
    StartingPosition: number;
    /* Ordered list of authenticator entries. First one will be set at position `StartingPosition`. At most allow 500 entries. */
    Entries: Id[];
};
export type AuthenticatorEntryUpdateRequest = {
    AuthenticatorKeyID: Id;
    /* Base64 representation of the entry content encrypted with the AuthenticatorKey */
    Content: string;
    /* Version of the format used to encode the contents of this entry */
    ContentFormatVersion: number;
    /* Last revision seen for this entry */
    LastRevision: number;
};
export type AuthenticatorReorderEntryRequest = {
    /* ID of the entry after the one we should move the entry. Null if it should go on the first place */
    AfterID?: Id | null;
};
export type AuthenticatorKeyCreateRequest = {
    /* Base64 representation of the authenticator key encrypted with the user key */
    Key: string;
};
export type AuthenticatorEntriesResponse = {
    /* List of authenticator entries */
    Entries: AuthenticatorEntryResponse[];
    /* Total number of authenticator entries */
    Total: number;
    /* ID of the last entry. Used for pagination */
    LastID?: Id | null;
};
export type AuthenticatorEntryResponse = {
    EntryID: Id;
    AuthenticatorKeyID: Id;
    /* Revision counter for the entry used in order to ensure consistency across clients */
    Revision: number;
    /* Version of the format used to encode the contents of this entry */
    ContentFormatVersion: number;
    /* Encrypted content of the entry */
    Content: string;
    /* Flags for the entry */
    Flags: number;
    /* Creation time of the entry in seconds */
    CreateTime: number;
    /* Modification time of the entry in seconds */
    ModifyTime: number;
};
export type AuthenticatorKeysResponse = {
    /* Authenticator keys for the user */
    Keys: AuthenticatorKeyResponse[];
};
export type AuthenticatorKeyResponse = {
    /* Base64 representation of the authenticator key encrypted with the user key */
    Key: string;
    KeyID: Id;
    UserKeyID: Id;
};
export type Id = string;
export type AuthenticatorEntryUpdateWithEntryRequest = {
    EntryID: Id;
    AuthenticatorKeyID: Id;
    /* Base64 representation of the entry content encrypted with the AuthenticatorKey */
    Content: string;
    /* Version of the format used to encode the contents of this entry */
    ContentFormatVersion: number;
    /* Last revision seen for this entry */
    LastRevision: number;
};
export type ApiResponse<
    Path extends string,
    Method extends string,
> = Path extends `authenticator/v1/entry/${string}/order`
    ? Method extends `put`
        ? { Code: ResponseCodeSuccess }
        : never
    : Path extends `authenticator/v1/entry/bulk`
      ? Method extends `put`
          ? {
                Code: ResponseCodeSuccess;
                /* List of authenticator entries */
                Entries?: AuthenticatorEntryResponse[];
            }
          : Method extends `post`
            ? {
                  Code: ResponseCodeSuccess;
                  /* List of authenticator entries */
                  Entries?: AuthenticatorEntryResponse[];
              }
            : Method extends `delete`
              ? { Code: ResponseCodeSuccess }
              : never
      : Path extends `authenticator/v1/entry/order`
        ? Method extends `put`
            ? { Code: ResponseCodeSuccess }
            : never
        : Path extends `authenticator/v1/entry/${string}`
          ? Method extends `put`
              ? { Code: ResponseCodeSuccess; Entry: AuthenticatorEntryResponse }
              : Method extends `delete`
                ? { Code: ResponseCodeSuccess }
                : never
          : Path extends `authenticator/v1/entry`
            ? Method extends `get`
                ? { Code: ResponseCodeSuccess; Entries: AuthenticatorEntriesResponse }
                : Method extends `post`
                  ? { Code: ResponseCodeSuccess; Entry: AuthenticatorEntryResponse }
                  : never
            : Path extends `authenticator/v1/key`
              ? Method extends `get`
                  ? { Code: ResponseCodeSuccess; Keys: AuthenticatorKeysResponse }
                  : Method extends `post`
                    ? { Code: ResponseCodeSuccess; Key: AuthenticatorKeyResponse }
                    : never
              : any;
export type ApiRequestBody<
    Path extends string,
    Method extends string,
> = Path extends `authenticator/v1/entry/${string}/order`
    ? Method extends `put`
        ? AuthenticatorReorderEntryRequest
        : never
    : Path extends `authenticator/v1/entry/bulk`
      ? Method extends `put`
          ? AuthenticatorEntryUpdateBulkRequest
          : Method extends `post`
            ? AuthenticatorCreateEntriesRequest
            : Method extends `delete`
              ? AuthenticatorEntryDeleteBulkInput
              : never
      : Path extends `authenticator/v1/entry/order`
        ? Method extends `put`
            ? AuthenticatorReorderBatchRequest
            : never
        : Path extends `authenticator/v1/entry/${string}`
          ? Method extends `put`
              ? AuthenticatorEntryUpdateRequest
              : never
          : Path extends `authenticator/v1/entry`
            ? Method extends `post`
                ? AuthenticatorCreateEntryRequest
                : never
            : Path extends `authenticator/v1/key`
              ? Method extends `post`
                  ? AuthenticatorKeyCreateRequest
                  : never
              : any;
