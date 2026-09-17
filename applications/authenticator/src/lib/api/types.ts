type AuthenticatorCreateEntryRequest = {
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
export type AuthenticatorReorderEntryRequest = {
    /* ID of the entry after the one we should move the entry. Null if it should go on the first place */
    AfterID?: Id | null;
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
type Id = string;
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
