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
export type ItemMoveMultipleToShareRequest = {
    /* Encrypted ID of the destination share */
    ShareID: string;
    /* Items to move to the destination share */
    Items: ItemMoveIndividualToShareRequest[];
};
export type NewUserInviteCreateRequest = {
    /* Email of the target user */
    Email: string;
    /* Invite target type. 1 = Vault, 2 = Item */
    TargetType: number;
    /* Base64 signature of "inviteemail|base64(vaultKey)" signed with the admin's address key */
    Signature: string;
    /* ShareRoleID for this invite. The values are in the top level Pass docs. */
    ShareRoleID: string;
    /* Base64 encrypted invite message encrypted with the object key */
    Data?: string | null;
    /* Invite encrypted item ID (only in case the invite is of type Item) */
    ItemID?: string | null;
    /* Expiration time for the share */
    ExpirationTime?: number | null;
};
export type NewUserInviteCreateBatchRequest = {
    /* New user invites */
    NewUserInvites: NewUserInviteCreateRequest[];
};
export type NewUserInvitePromoteRequest = {
    /* List of keys encrypted for the other user's address key and signed with your address key */
    Keys: KeyRotationKeyPair[];
};
export type AliasContactCreateInput = {
    /* Email to send emails to via this alias */
    Email: string;
    /* Name to be shown for this contact */
    Name?: string | null;
};
export type AliasContactUpdateBlockedInput = {
    /* Whether emails from this email address will be forwarded to the user */
    Blocked: boolean;
};
export type ItemCreateRequest = {
    /* Rotation of the VaultKey used to encrypt this item */
    KeyRotation: number;
    /* Version of the content format used to create the item */
    ContentFormatVersion: number;
    /* Encrypted item content encoded in Base64 */
    Content: string;
    /* Item key encrypted with the VaultKey, contents encoded in base64 */
    ItemKey: string;
};
export type CustomAliasCreateRequest = {
    /* Prefix for the alias to be created (prefix.xxx@domain.com) */
    Prefix: string;
    /* Signed suffix for the alias to be created (xxx.asdaa3@domain.com.signature) */
    SignedSuffix: string;
    /* IDs for the mailboxes that will receive emails sent to this alias */
    MailboxIDs: number[];
    /* Optionally, the alias name to be used for this alias */
    AliasName?: string | null;
    Item: ItemCreateRequest;
};
export type SetAliasMailboxesRequest = {
    /* IDs for the mailboxes that will receive emails sent to this alias */
    MailboxIDs: number[];
};
export type AliasUpdateStatusRequest = {
    /* Desired alias status */
    Enable: boolean;
};
export type AliasUpdateNoteRequest = {
    /* Desired note for the alias */
    Note?: string | null;
};
export type AliasUpdateNameRequest = {
    /* Desired name for the alias */
    Name?: string | null;
};
export type EnableSLSyncRequest = {
    /* ShareID to store the alias when syncing */
    DefaultShareID?: EncryptedId | null;
};
export type CreatePendingAliasesRequest = {
    /* Pending aliases to be created. At most 100 */
    Items: CreatePendingAliasRequest[];
};
export type BreachUpdateMonitorAddressRequest = {
    /* Define whether to monitor this address or not */
    Monitor: boolean;
};
export type BreachEmailCreateRequest = {
    /* Email to create a breach monitor for */
    Email: string;
};
export type BreachEmailValidateRequest = {
    /* Code to validate */
    Code: string;
};
export type BreachUpdateCustomEmailRequest = {
    /* Define whether to monitor this custom email or not */
    Monitor: boolean;
};
export type CustomDomainCreateRequest = {
    /* Domain to be created */
    Domain: string;
};
export type CustomDomainUpdateCatchAllSettingRequest = {
    /* Catch-all setting value */
    CatchAll: boolean;
};
export type CustomDomainUpdateNameSettingRequest = {
    /* Custom domain default name */
    Name?: string | null;
};
export type CustomDomainUpdateRandomPrefixGenerationSettingRequest = {
    /* Random prefix generation setting value */
    RandomPrefixGeneration: boolean;
};
export type CustomDomainUpdateMailboxesSettingRequest = {
    /* Mailbox IDs */
    MailboxIDs: number[];
};
export type CreatePendingFileRequest = {
    /* File metadata encrypted with an attachmentKey and encoded in Base64 */
    Metadata: string;
    /* Number of chunks this file will have */
    ChunkCount: number;
    /* File version (OPTIONAL UNTIL BE MIGRATES) */
    EncryptionVersion?: number;
};
export type UpdatePendingFileRequest = {
    /* File metadata encrypted with an attachmentKey and encoded in Base64 */
    Metadata: string;
};
export type ImportItemBatchRequest = {
    /* Items to be imported. At most 100 */
    Items: ImportItemRequest[];
};
export type InviteAcceptRequest = {
    /* Invite keys encrypted and signed with the User Key */
    Keys: KeyRotationKeyPair[];
};
export type AliasAndItemCreateRequest = { Alias: CustomAliasCreateRequest; Item: ItemCreateRequest };
export type ItemsToTrashRequest = {
    /* Pairs of item IDs with the latest revision. At most 100. */
    Items: ItemIDRevision[];
};
export type ItemsToSoftDeleteRequest = {
    /* ItemIDs with their current revision. At most 100 items. */
    Items: ItemIDRevision[];
    /* Skip checking that the items are in the trash. Allows to delete directly */
    SkipTrash?: boolean | null;
};
export type ItemMarkAsReadBatchRequest = {
    /* List of items and times read for this vault */
    ItemTimes: ItemMarkAsReadRequest[];
};
export type ItemUpdateRequest = {
    KeyRotation: number;
    /* Last item revision existing when the item was created */
    LastRevision: number;
    /* Encrypted item content encoded in Base64 */
    Content: string;
    /* Version of the content format used to create the item */
    ContentFormatVersion: number;
};
export type UpdateItemLastUseTimeRequest = {
    /* Time when the item was last used. If no value is passed then the current server time will be used. */
    LastUseTime?: number | null;
};
export type ItemUpdateFlagsRequest = {
    /* Whether to skip the security health checks. Null means leave it as it is now. */
    SkipHealthCheck?: boolean | null;
};
export type ItemMoveSingleToShareRequest = {
    /* Encrypted ID of the destination share */
    ShareID: string;
    /* Data to create the new item */
    Item?: ItemCreateRequest | null;
    /* Previous revisions of this item */
    History?: ItemHistoryRequest[];
    /* Item keys encrypted with the target vault key */
    ItemKeys: EncodedItemKeyRotation[];
};
export type LinkFileToItemInput = {
    /* Last itemRevision */
    ItemRevision: number;
    /* List of files to be linked */
    FilesToAdd: LinkFileToItemFileData[];
    /* List of file ids to be removed */
    FilesToRemove: Id[];
};
export type FileUpdateMetadataInput = {
    /* New file metadata encrypted with the file key, encoded in Base64 */
    Metadata: string;
};
export type FileRestoreInput = {
    /* FileKey encrypted with the ItemKey, encoded in Base64 */
    FileKey: string;
    /* ItemKeyRotation used to encrypt the file key */
    ItemKeyRotation: number;
};
export type FileRestoreBatchInput = {
    /* Files to restore */
    FilesToRestore: FileRestoreSingleInput[];
    /* ItemKeyRotation used to encrypt the files keys */
    ItemKeyRotation: number;
};
export type KeyRotationRequest = {
    /* Current key rotation */
    CurrentKeyRotation: number;
    /* New vault key base64 encoded, encrypted and signed with the current primary user key */
    VaultKey: string;
    /* New encryption keys for the items in the vault */
    ItemKeys: EncodedKeyRotationItemKey[];
    /* Vault key encrypted for the users that have vault shares EXCEPT the current user */
    VaultKeyForShares: EncodedKeyRotationShareKeyForAddress[];
    /* Item key encrypted each share of type item */
    ItemKeysForShares: EncodedKeyRotationShareKeyForAddress[];
};
export type PendingShareKeyPromoteRequest = {
    /* Pending share keys to promote */
    Keys: EncryptedKeyWithRotation[];
};
export type ChangeNotificationStateRequest = { State: InAppNotificationState };
export type OrganizationUpdateSettingsRequest = {
    /* Allowed ways to share within the organization. 0 means unrestricted, 1 means sharing is only allowed within the organization */
    ShareMode?: number | null;
    /* Who is allowed to accept an invite from outside the organization. 0 means unrestricted, 1 means only admins can accept invites from outside the organization */
    ShareAcceptMode?: number | null;
    /* Is item sharing enabled. 0 means no, 1 yes */
    ItemShareMode?: number | null;
    /* Are secure links enabled. 0 means no, 1 yes */
    PublicLinkMode?: number | null;
    /* Force pass to lock after given seconds of time. 0 means disabled. */
    ForceLockSeconds?: number | null;
    /* Allowed ways of exporting the data owned by the org. 0 means anyone can export. 1 means only org admins can export */
    ExportMode?: number | null;
    /* Who can create vaults in the organization. 0 means any user can create vaults. 1 means only org admins can create vaults */
    VaultCreateMode?: number | null;
};
export type OrganizationUpdatePasswordPolicyRequest = {
    /* Whether subusers are allowed to generate random passwords */
    RandomPasswordAllowed: boolean;
    /* Minimum password length. Default limit if null. */
    RandomPasswordMinLength?: number | null;
    /* Maximum password length. Default limit if null. */
    RandomPasswordMaxLength?: number | null;
    /* Whether the password must include numbers. If true, it must. If false, it must not. Cannot be changed if not null. Can be changed if null. */
    RandomPasswordMustIncludeNumbers?: boolean | null;
    /* Whether the password must include symbols. If true, it must. If false, it must not. Cannot be changed if not null. Can be changed if null. */
    RandomPasswordMustIncludeSymbols?: boolean | null;
    /* Whether the password must include uppercase characters. If true, it must. If false, it must not. Cannot be changed if not null. Can be changed if null. */
    RandomPasswordMustIncludeUppercase?: boolean | null;
    /* Whether subusers are allowed to generate memorable passwords */
    MemorablePasswordAllowed: boolean;
    /* Minimum amount of words for the memorable passwords. Default limit if null. */
    MemorablePasswordMinWords?: number | null;
    /* Maximum amount of words for the memorable passwords. Default limit if null. */
    MemorablePasswordMaxWords?: number | null;
    /* Whether the password must capitalize words. If true, it must. If false, it must not. Cannot be changed if not null. Can be changed if null. */
    MemorablePasswordMustCapitalize?: boolean | null;
    /* Whether the password must include numbers. If true, it must. If false, it must not. Cannot be changed if not null. Can be changed if null. */
    MemorablePasswordMustIncludeNumbers?: boolean | null;
};
export type UserMonitorReportInput = {
    /* Number of reused passwords */
    ReusedPasswords: number;
    /* Number of items with inactive 2FA */
    Inactive2FA: number;
    /* Number of excluded items */
    ExcludedItems: number;
    /* Number of weak passwords */
    WeakPasswords: number;
};
export type PublicLinkCreateRequest = {
    /* Last revision of the item */
    Revision: number;
    /* Expiration time for the link in seconds. Minimum 3600 (1h), at maximum 30 days in the future */
    ExpirationTime: number;
    /* Maximum amount of times that the item can be read. Unlimited reads if null */
    MaxReadCount?: number;
    /* Encrypted item key encoded in base64 */
    EncryptedItemKey: string;
    /* Link key encrypted with the share key encoded in base64 */
    EncryptedLinkKey: string;
    /* ShareKey rotation used for encrypting the encryptedLinkKey */
    LinkKeyShareKeyRotation: number;
    /* If the link key is being encrypted with the item key */
    LinkKeyEncryptedWithItemKey?: unknown;
};
export type UserSessionLockRequest = {
    /* Lock code to attach to this session */
    LockCode: string;
    /* Number of seconds the session will stay unlocked */
    UnlockedSecs: number;
};
export type UserSessionUnlockRequest = {
    /* Lock code to attach to this session */
    LockCode: string;
};
export type InviteCreateRequest = {
    /* List of keys encrypted for the other user's address key and signed with your address key */
    Keys: KeyRotationKeyPair[];
    /* Email of the target user */
    Email: string;
    /* Invite target type. 1 = Vault, 2 = Item */
    TargetType: number;
    /* ShareRoleID for this invite. The values are in the top level Pass docs. */
    ShareRoleID: string;
    /* If this invite is generated from a new user invite. ID of the original new user invite */
    SourceNewUserInviteID?: string | null;
    /* Invite encrypted item ID (only in case the invite is of type Item) */
    ItemID?: string | null;
    /* Base64 encrypted invite message encrypted with the object key */
    Data?: string | null;
    /* Expiration time for the share */
    ExpirationTime?: number | null;
};
export type InviteCreateBatchRequest = {
    /* Invites for existing users */
    Invites: InviteCreateRequest[];
};
export type CheckAddressForInviteRequest = {
    /* Addresses to check. At most 10 addresses are allowed */
    Emails: string[];
};
export type ShareUpdateRequest = {
    /* ShareRoleID to apply to this share */
    ShareRoleID?: string | null;
    /* Expiration time to set for this share */
    ExpireTime?: number | null;
};
export type UserAliasSettingsDefaultMailboxIDUpdateIinput = {
    /* Default mailbox to use */
    DefaultMailboxID: number;
};
export type UserAliasSettingsDefaultAliasDomainUpdateInput = {
    /* Default domain when creating aliases */
    DefaultAliasDomain?: string | null;
};
export type UserMailboxCreateRequest = {
    /* Email to create the mailbox */
    Email: string;
};
export type UserMailboxVerifyRequest = {
    /* Code to validate the mailbox */
    Code: string;
};
export type UserMailboxDeleteRequest = {
    /* Mailbox ID to which to transfer all existing aliases (optional) */
    TransferMailboxID?: number | null;
};
export type SuccessfulResponse = { Code: '1000' };
export type UserMailboxChangeEmailRequest = {
    /* New email for this mailbox */
    Email: string;
};
export type UpdateUserMonitorStateRequest = {
    /* Enable or disable monitor for proton addresses. Null leaves the value as is */
    ProtonAddress?: boolean | null;
    /* Enable or disable monitor for aliases. Null leaves the value as is */
    Aliases?: boolean | null;
};
export type AddSRPRequest = { SrpModulusID: Id; SrpVerifier: BinaryString; SrpSalt: BinaryString };
export type SRPAuthRequest = {
    ClientEphemeral: BinaryString;
    ClientProof: BinaryString;
    /* SRP session ID */
    SrpSessionID: string;
};
export type UpdateInAppNotificationsDisabledRequest = {
    /* Enable or disable the "InApp notifications disabled" setting */
    InAppNotificationsDisabled: boolean;
};
export type UserRedeemCouponInput = {
    /* Coupon to redeem */
    Coupon: string;
};
export type VaultCreateRequest = {
    /* AddressID that should be displayed as the owner */
    AddressID: string;
    /* Vault content protocol buffer data encrypted with the vault key */
    Content: string;
    /* Vault content format version. Should be 1 for now. */
    ContentFormatVersion: number;
    /* Vault key encrypted and signed with the primary user key */
    EncryptedVaultKey: string;
};
export type VaultUpdateRequest = {
    /* Vault content protocol buffer data encrypted with the vault key */
    Content: string;
    /* Vault content format version. Should be 1 for now. */
    ContentFormatVersion: number;
    /* Key rotation used to encrypt the content */
    KeyRotation: number;
};
export type VaultTransferOwnershipRequest = {
    /* ShareID to move the ownership to. It has to have admin privileges */
    NewOwnerShareID: string;
};
export type ItemMoveMultipleResponse = { Items: ItemRevisionContentsResponse[] };
export type AliasContactListResponse = {
    /* Contact list for this alias */
    Contacts: AliasContactWithStatsGetResponse[];
    /* Total count of contacts */
    Total: number;
    /* Next id to use to get next page */
    LastID: number;
};
export type AliasContactGetResponse = {
    /* ID for this contact */
    ID: number;
    /* Contact name */
    Name?: string | null;
    /* Whether this contact can send emails to this alias or not */
    Blocked: boolean;
    /* Email to which the user has to send an email so the contact receives it as coming from the alias */
    ReverseAlias: string;
    /* Real email of the contact */
    Email: string;
    /* When the contact was created */
    CreateTime: number;
};
export type AliasContactWithStatsGetResponse = {
    /* ID for this contact */
    ID: number;
    /* Contact name */
    Name?: string | null;
    /* Whether this contact can send emails to this alias or not */
    Blocked: boolean;
    /* Email to which the user has to send an email so the contact receives it as coming from the alias */
    ReverseAlias: string;
    /* Real email of the contact */
    Email: string;
    /* When the contact was created */
    CreateTime: number;
    /* How many emails the user sent through this contact in the last 14 days */
    RepliedEmails: number;
    /* How many emails the user received through this contact in the last 14 days */
    ForwardedEmails: number;
    /* How many emails were blocked to this contact in the last 14 days */
    BlockedEmails: number;
};
export type AliasOptionsResponse = {
    /* List of possible suffixes when creating a new alias. Only valid for 10 minutes */
    Suffixes: AliasSuffixResponse[];
    /* List of possible mailboxes when creating a new alias */
    Mailboxes: AliasMailboxResponse[];
    /* Whether the user can create new alias */
    CanCreateAlias: boolean;
};
export type ItemRevisionContentsResponse = {
    ItemID: string;
    Revision: number;
    ContentFormatVersion: number;
    /* Flags for this item. Possible values:
<ul>
    <li>SkipHealthCheck: 1<<0 = 1</li>
    <li>EmailBreached: 1<<1 = 2</li>
</ul> */
    Flags: number;
    KeyRotation: number;
    /* Base64 encoded item contents */
    Content: string;
    /* Base64 encoded item key. Only for vault shares. */
    ItemKey?: string | null;
    /* Revision state. Values: 1 = Active, 2 = Trashed */
    State: number;
    /* Whether this item is pinned for this user */
    Pinned: boolean;
    /* If the item is pinned, when it was pinned */
    PinTime?: number | null;
    /* Number of shares this item has */
    ShareCount: number;
    /* In case this item contains an alias, this is the email address for the alias */
    AliasEmail?: string | null;
    /* Creation time of the item */
    CreateTime: number;
    /* Time of the latest modification of the item */
    ModifyTime: number;
    /* Time when the item was last used */
    LastUseTime: number;
    /* Creation time of this revision */
    RevisionTime: number;
};
export type AliasDetailsResponse = {
    /* Alias email */
    Email: string;
    /* If this user can modify this alias */
    Modify: boolean;
    /* List of mailboxes that will receive emails for this alias */
    Mailboxes: AliasMailboxResponse[];
    /* List of possible mailboxes that can be linked to the alias */
    AvailableMailboxes: AliasMailboxResponse[];
    /* Note that this alias has in SL */
    Note?: string | null;
    /* Name that this alias has in SL. The recipient will see this as the sender name */
    Name?: string | null;
    /* Display name that the recipients will see when receiving an email from this alias */
    DisplayName: string;
    Stats: AliasStatsResponse;
    /* How many contacts does the alias have */
    ContactCount: number;
};
export type BreachesResponse = {
    /* Whether user is eligible to see the full breaches, or just sees a sample; paid users will get full "breaches", free users will only see few "samples" of breaches */
    IsEligible: boolean;
    /* Total number of breaches that user has */
    Count: number;
    Breaches: Breach[];
    Samples: BreachSample[];
};
export type SlSyncStatusOutput = {
    /* Whether the Sync with SimpleLogin is enabled */
    Enabled: boolean;
    /* How many aliases are pending to be synced */
    PendingAliasCount: number;
};
export type SlPendingAliasesResponse = {
    /* Aliases to be synced */
    Aliases: SlPendingAliasResponse[];
    /* Total number of aliases to be synced */
    Total: number;
    /* Token to pass for getting the next page. Null if there is none */
    LastToken?: string | null;
};
export type ItemRevisionListResponse = {
    RevisionsData: ItemRevisionContentsResponse[];
    /* Total number of items */
    Total: number;
    /* Token to pass for getting the next page. Null if there is none */
    LastToken: string | null;
};
export type BreachesGetResponse = {
    /* Count of addresses and custom emails that have breaches. This does not include aliases */
    EmailsCount: number;
    /* List of some domains that have breaches as a sneak peek for free users */
    DomainsPeek: BreachDomainPeekResponse[];
    /* List of addresses that have a breach */
    Addresses: BreachAddressGetResponse[];
    /* List of custom emails that have a breach */
    CustomEmails: BreachCustomEmailGetResponse[];
    /* Whether the user has custom domains or not */
    HasCustomDomains: boolean;
};
export type BreachCustomEmailListResponse = {
    /* List of custom emails */
    CustomEmails: BreachCustomEmailGetResponse[];
};
export type BreachCustomEmailGetResponse = {
    /* Id of the email monitor */
    CustomEmailID: string;
    /* email */
    Email: string;
    /* Whether this custom email is verified */
    Verified: boolean;
    /* Number of breaches this custom email appears in */
    BreachCounter: number;
    /* Flags for this custom email:<br/><ul><li>1 << 0 (1): Monitoring disabled</li></ul> */
    Flags: number;
    /* Last breach time if any */
    LastBreachTime?: number | null;
};
export type CustomDomainsListOutput = {
    /* List of domains the user has access to */
    Domains: CustomDomainOutput[];
    /* ID of the last domain (null if no domains) */
    LastID?: number | null;
    /* How many domains are in total */
    Total: number;
};
export type CustomDomainOutput = {
    /* ID for the created domain */
    ID: number;
    /* Domain name */
    Domain: string;
    /* Verification record to validate the domain */
    VerificationRecord: string;
    /* Whether the domain has verified the ownership */
    OwnershipVerified: boolean;
    /* Whether the domain has verified the MX records */
    MxVerified: boolean;
    /* Whether the domain has verified the DKIM records */
    DkimVerified: boolean;
    /* Whether the domain has verified the SPF records */
    SpfVerified: boolean;
    /* Whether the domain has verified the DMARC records */
    DmarcVerified: boolean;
    /* How many aliases does the custom domain have */
    AliasCount: number;
    /* Creation time of the domain (unix timestamp) */
    CreateTime: number;
};
export type CustomDomainValidationOutput = {
    /* Whether the domain ownership has been verified */
    OwnershipVerified: boolean;
    /* Whether the custom domain has the MX records verified */
    MxVerified: boolean;
    /* List of MX record errors */
    MxErrors: string[];
    /* Whether the custom domain has the SPF records verified */
    SpfVerified: boolean;
    /* List of SPF record errors */
    SpfErrors: string[];
    /* Whether the custom domain has the DKIM records verified */
    DkimVerified: boolean;
    /* List of DKIM record errors */
    DkimErrors: string[];
    /* Whether the custom domain has the DMARC records verified */
    DmarcVerified: boolean;
    /* List of DMARC record errors */
    DmarcErrors: string[];
    /* List of domain verification errors */
    VerificationErrors: string[];
};
export type CustomDomainSettingsOutput = {
    /* ID of the custom domain */
    ID: number;
    /* Indicates if catch-all is enabled for the domain */
    CatchAll: boolean;
    /* List of mailboxes associated with the custom domain */
    Mailboxes: CustomDomainMailboxOutput[];
    /* Default display name for emails sent from the domain */
    DefaultDisplayName?: string | null;
    /* Indicates if random prefix generation is enabled */
    RandomPrefixGeneration: boolean;
};
export type CreatePendingFileOutput = { FileID: Id };
export type InvitesGetResponse = {
    /* UserInvites */
    Invites: InviteDataForUser[];
};
export type ShareGetResponse = {
    ShareID: string;
    VaultID: string;
    /* AddressID that will be displayed as the owner of the share */
    AddressID: string;
    /* Whether this vault is primary for this user */
    Primary: boolean;
    /* Whether the user is owner of this vault */
    Owner: boolean;
    /* Type of share. 1 for vault, 2 for item */
    TargetType: number;
    /* TargetID for this share */
    TargetID: string;
    /* Members for the target of this share */
    TargetMembers: number;
    /* Max members allowed for the target of this share */
    TargetMaxMembers: number;
    /* Whether this share is shared or not */
    Shared: boolean;
    /* How many invites are pending of acceptance */
    PendingInvites: number;
    /* How many new user invites are waiting for an admin to create the proper invite */
    NewUserInvitesReady: number;
    /* Permissions for this share */
    Permission: number;
    /* Whether this share can be used for auto-fill */
    CanAutoFill: boolean;
    /* ShareRoleID for this share. The values are in the top level Pass docs. */
    ShareRoleID: string;
    /* Base64 encoded content of the share. Only shown if it a vault share */
    Content?: string | null;
    /* Key rotation that should be used to open the content */
    ContentKeyRotation?: number | null;
    /* Content format version */
    ContentFormatVersion?: number | null;
    /* If the share will expire, when it will expire */
    ExpireTime?: number | null;
    /* Share creation time */
    CreateTime: number;
};
export type AliasAndItemResponse = { Alias: ItemRevisionContentsResponse; Item: ItemRevisionContentsResponse };
export type ItemTrashResponse = { Items: ItemRevisionResponse[] };
export type ItemLatestKeyResponse = {
    /* Key rotation */
    KeyRotation: number;
    /* Base64 representation of the encrypted Item Key */
    Key: string;
};
export type ItemGetKeysResponse = {
    /* Keys */
    Keys: EncodedItemKeyRotation[];
    /* Total number of keys */
    Total: number;
};
export type ItemFilesOutput = {
    /* Files linked to the item */
    Files: ItemFileOutput[];
    /* Total number of files linked to the item */
    Total: number;
    /* LastID parameter to use for pagination */
    LastID?: Id | null;
};
export type ItemFileOutput = {
    FileID: Id;
    /* Size of the file in bytes (sum of the chunk sizes) */
    Size: number;
    /* Encrypted metadata of the file */
    Metadata: string;
    /* FileKey of the file encrypted with the ItemKey */
    FileKey: string;
    /* ItemKeyRotation for which ItemKey to use to decrypt the FileKey */
    ItemKeyRotation: number;
    /* Chunks that contain the contents of the file */
    Chunks: ItemFileChunkOutput[];
    /* Encryption version of the file (OPTIONAL UNTIL BE MIGRATES) */
    EncryptionVersion?: number;
    /* Item revision when the file was added */
    RevisionAdded: number;
    /* Item revision when the file was removed. If null, the file is still present */
    RevisionRemoved?: number | null;
    /* Randomly BE generated UID of the file that is persisted across restores. Same file should have the same UID */
    PersistentFileUID: string;
    /* Timestamp of when the file was created */
    CreateTime: number;
    /* Timestamp of when the file was last modified */
    ModifyTime: number;
};
export type ItemFileRestoreResponse = { Item: ItemRevisionContentsResponse; File: ItemFileOutput };
export type ItemFileRestoreBatchResponse = {
    Item: ItemRevisionContentsResponse;
    /* New files created after restoring them */
    Files: ItemFileOutput[];
};
export type ShareKeysResponse = {
    /* Keys */
    Keys: ShareKeyResponse[];
    /* Total number of keys */
    Total: number;
};
export type ShareKeyResponse = {
    /* Rotation for this key */
    KeyRotation: number;
    /* Base64 encoded key */
    Key: string;
    /* UserKeyID to open this key */
    UserKeyID: string;
    /* When was this key created */
    CreateTime: number;
};
export type PendingShareKeysListResponse = {
    /* Pending share keys */
    Pending: PendingShareKeyGetResponse[];
};
export type UserNotificationList = {
    /* List of notifications */
    Notifications: InAppNotification[];
    /* Total number of notifications */
    Total: number;
    /* ID of the last notification in order to paginate */
    LastID?: string | null;
};
export type OrganizationGetResponse = {
    /* Whether this user can update the organization */
    CanUpdate: boolean;
    Settings: OrganizationSettingsGetResponse;
};
export type MemberMonitorReportList = {
    /* User monitor report for an organization member */
    MemberReports: MemberMonitorReport[];
    /* Last ID for getting the next batch */
    TotalMemberCount: number;
};
export type EventIDGetResponse = { EventID: Id };
export type PassEventListResponse = {
    UpdatedShare: ShareGetResponse;
    /* New or updated items */
    UpdatedItems: ItemRevisionContentsResponse[];
    /* Deleted items */
    DeletedItemIDs: string[];
    /* Items that have the last use time updated */
    LastUseItems: ItemIDLastUseTime[];
    /* New key rotation value if there has been a key rotation */
    NewKeyRotation?: number | null;
    /* New eventID if for future requests */
    LatestEventID: string;
    /* If there are more events to process this will be true */
    EventsPending: boolean;
    /* If the share needs a full refresh this will be true */
    FullRefresh: boolean;
};
export type PublicLinkCreateResponse = {
    /* URL to the public link (without the key portion) */
    Url: string;
    /* Encrypted id of the public link */
    PublicLinkID: string;
    /* Timestamp that represents when the link expires */
    ExpirationTime: number;
};
export type PublicLinkGetContentResponse = {
    /* Base64 encoded item contents encrypted with the itemKey */
    Contents: string;
    /* Base64 encrypted item key */
    ItemKey: string;
    /* Token to use in order to fetch the files for the item. If null, the item does not have files */
    FilesToken?: string | null;
    /* ContentFormatVersion of the item contents */
    ContentFormatVersion: number;
    /* How many times the link has been read */
    ReadCount: number;
    /* If not null, the maximum amount of times the link can be read */
    MaxReadCount: number;
    /* Timestamp in seconds of the expiration time for the link */
    ExpirationTime: number;
    /* If the link key is being encrypted with the item key */
    LinkKeyEncryptedWithItemKey?: unknown;
};
export type PublicLinkGetResponse = {
    /* ID of the public link */
    LinkID: string;
    /* Number of times the item has been read */
    ReadCount: number;
    /* If not null, maximum number of times the item can be read */
    MaxReadCount: number;
    /* Link expiration timestamp */
    ExpirationTime: number;
    /* ShareID of the item that the link points at */
    ShareID: string;
    /* itemID of the item that the link points at */
    ItemID: string;
    /* URL to the link */
    LinkURL: string;
    /* LinkKey encrypted with the ShareKey in B64 */
    EncryptedLinkKey: string;
    /* KeyRotation for the ShareKey used to encrypt the LinkKey */
    LinkKeyShareKeyRotation: number;
    /* Whether the link is active or already expired/beyond read count */
    Active: boolean;
    /* If the link key is being encrypted with the item key */
    LinkKeyEncryptedWithItemKey?: unknown;
};
export type SessionLockStorageTokenResponse = {
    /* Storage token to encrypt the local storage */
    StorageToken: string;
};
export type SessionLockCheckExistsResponse = {
    /* Whether this session has a lock registered or not */
    Exists: boolean;
    /* If the lock exists, that is the unlocked time */
    UnlockedSecs?: number | null;
};
export type SharesGetResponse = {
    /* List of shares */
    Shares: ShareGetResponse[];
};
export type InvitesForVaultGetResponse = {
    /* Invites for this share */
    Invites: VaultInviteData[];
    /* New user invites for this share */
    NewUserInvites: NewUserInviteGetResponse[];
};
export type InviteRecommendationsResponse = {
    /* Emails recommended to share the vault with */
    RecommendedEmails: string[];
    /* Plan internal name. It will be null for free users. */
    PlanInternalName: string;
    /* Group display name. It will be null for free users. */
    GroupDisplayName: string;
    /* Emails recommended based on the user plan. Will only return something for paid users */
    PlanRecommendedEmails: string[];
    /* Token to retrieve the next page. Will be null for the last page. */
    PlanRecommendedEmailsNextToken: string;
};
export type ActiveSharesInVaultGetResponse = {
    /* Shares */
    Shares: ActiveShareGetResponse[];
    /* Total amount of shares */
    Total: number;
    /* Token to pass for getting the next page. Null if there is none */
    LastToken: string;
};
export type ActiveShareGetResponse = {
    /* ID of the share */
    ShareID: string;
    /* Name of the user */
    UserName: string;
    /* Email of the user */
    UserEmail: string;
    /* Whether this is the owner of the share */
    Owner: boolean;
    /* Type of share. 1 for vault, 2 for item */
    TargetType: number;
    /* ID of the top object that this share gives access to */
    TargetID: string;
    /* Permissions this share has */
    Permission: number;
    /* ShareRoleID this share has */
    ShareRoleID: string;
    /* Expiration time if set */
    ExpireTime?: number | null;
    /* Creation time of this share */
    CreateTime: number;
};
export type GetMissingAliasResponse = {
    /* MissingAlias */
    MissingAlias: MissingAliasDto[];
};
export type UserAliasCountResponse = {
    /* Total number of alias the user has in SL */
    Total: number;
};
export type UserAliasSettingsGetOutput = {
    /* Default domain when creating aliases */
    DefaultAliasDomain?: string | null;
    /* Default mailbox for new aliases */
    DefaultMailboxID: number;
};
export type UserAliasDomainListOutput = {
    /* List of domains */
    Domains: UserAliasDomainOutput[];
};
export type UserMailboxListOutput = {
    /* List of mailboxes */
    Mailboxes: UserMailboxOutput[];
};
export type UserMailboxOutput = {
    /* Mailbox ID */
    MailboxID: number;
    /* Mailbox email */
    Email: string;
    /* In case there is a pending email change, this will show what is the requested email change */
    PendingEmail?: string | null;
    /* Whether the user has verified that he owns the mailbox */
    Verified: boolean;
    /* Whether the mailbox is the default one */
    IsDefault: boolean;
    /* How many aliases does this mailbox have */
    AliasCount: number;
};
export type UserAccessGetResponse = {
    Plan: PassPlanResponse;
    Monitor: UserMonitorStatusResponse;
    /* Pending invites for this user */
    PendingInvites: number;
    /* Number of new user invites ready for an admin to accept */
    WaitingNewUserInvites: number;
    /* Request display upgrade to version */
    MinVersionUpgrade?: string | null;
    UserData: UserDataResponse;
};
export type UserAccessCheckGetResponse = {
    /* When this user started using Pass */
    ActivationTime: number;
};
export type UserMonitorStatusResponse = {
    /* If the monitor for proton address leaks is enabled */
    ProtonAddress: boolean;
    /* If the monitor for proton address leaks is enabled */
    Aliases: boolean;
};
export type SRPGetOutput = {
    /* Modulus for the SRP flow */
    Modulus: string;
    ServerEphemeral: BinaryString;
    /* SessionID of the SRP flow */
    SrpSessionID: string;
    SrpSalt: BinaryString;
    /* SRP version */
    Version: number;
};
export type SyncEventListOutput = {
    LastEventID: Id;
    ItemsUpdated?: SyncEventShareItemOutput[];
    ItemsDeleted?: SyncEventShareItemOutput[];
    SharesUpdated?: SyncEventShareOutput[];
    SharesDeleted?: SyncEventShareOutput[];
    SharesToGetInvites?: SyncEventShareOutput[];
    SharesWithInvitesToCreate?: SyncEventShareOutput[];
    PlanChanged?: boolean;
    EventsPending?: boolean;
    FullRefresh?: boolean;
};
export type ItemMoveIndividualToShareRequest = {
    /* Encrypted ID of the source item to move */
    ItemID: string;
    /* Data to create the new item in the destination vault */
    Item?: ItemCreateRequest | null;
    /* Previous revisions of this item */
    History?: ItemHistoryRequest[];
    /* Item keys encrypted with the target vault key */
    ItemKeys: EncodedItemKeyRotation[];
};
export type KeyRotationKeyPair = {
    /* Key rotation */
    KeyRotation: number;
    /* Encrypted key encoded in base64 */
    Key: string;
};
export type EncryptedId = string;
export type CreatePendingAliasRequest = { PendingAliasID: Id; Item: ItemCreateRequest };
export type ImportItemRequest = {
    Item: ItemCreateRequest;
    /* Alias email in case this item is an alias item */
    AliasEmail?: string | null;
    /* Wether this item is the trash. Default value is false. */
    Trashed?: boolean;
    /* When was this item created. By default it will be now */
    CreateTime?: number | null;
    /* When was this item modified. By default it will be now */
    ModifyTime?: number | null;
};
export type ItemIDRevision = {
    /* ItemID */
    ItemID: string;
    /* Current revision for the item */
    Revision: number;
};
export type ItemMarkAsReadRequest = { ItemID: EncryptedId; Timestamp: number };
export type ItemHistoryRequest = {
    /* Revision id for this entry */
    Revision: number;
    Item: ItemCreateRequest;
};
export type EncodedItemKeyRotation = {
    /* Rotation for this key */
    KeyRotation: number;
    /* Base64 encoded key */
    Key: string;
};
export type LinkFileToItemFileData = {
    FileID: Id;
    /* File key encrypted with the item key represented in Base64 */
    FileKey: string;
};
export type Id = string;
export type FileRestoreSingleInput = {
    FileID: Id;
    /* FileKey encrypted with the ItemKey, encoded in Base64 */
    FileKey: string;
};
export type EncodedKeyRotationItemKey = {
    /* ItemID for this encrypted key */
    ItemID: string;
    /* Base64 encoded item key */
    ItemKey: string;
};
export type EncodedKeyRotationShareKeyForAddress = {
    /* ShareID for this key */
    ShareID: string;
    /* AddressID to which this key is encrypted */
    AddressID: string;
    /* Base64 encoded key encrypted for the address key of the user and signed with our address key */
    EncryptedKeyForAddress: string;
};
export type EncryptedKeyWithRotation = {
    /* Key rotation */
    KeyRotation: number;
    /* Encrypted key encoded in base64 */
    EncryptedKey: string;
};
export enum InAppNotificationState {
    UNREAD = 0,
    READ = 1,
    DISMISSED = 2,
}
export type BinaryString = string;
export type AliasSuffixResponse = {
    /* Alias ending including the domain */
    Suffix: string;
    /* Signed suffix to ensure users cannot generate their own */
    SignedSuffix: string;
    /* Whether this is a user domain or a public SL domain */
    IsCustom: boolean;
    /* Whether this is a premium domain or a free SL domain */
    IsPremium: boolean;
    /* Domain that this suffix uses */
    Domain: string;
};
export type AliasMailboxResponse = {
    /* ID of the mailbox in SimpleLogin */
    ID: number;
    /* Email of the mailbox */
    Email: string;
};
export type AliasStatsResponse = {
    /* Count of emails forwarded through this alias in the last 14 days */
    ForwardedEmails: number;
    /* Count of emails replied to in the last 14 days */
    RepliedEmails: number;
    /* Count of emails blocked in the last 14 days */
    BlockedEmails: number;
};
export type Breach = {
    ID: Id;
    /* User's email formatted exactly how it appeared in the breach */
    Email: string;
    ResolvedState: BreachAlertState;
    /* Severity of the breach expressed as a number on a scale 0.0 -> 1.0; this way we can easily add new severities in the future; for now, interpret in a following way: low: 0.00 <= severity < 0.33, medium: 0.33 <= severity < 0.67, high: 0.67 <= severity <= 1.00 */
    Severity: number;
    /* Translated breach name */
    Name: string;
    /* Date & time when we imported this breach, ISO 8601 */
    CreatedAt: string;
    /* Date & time when the breach probably happened, ISO 8601 */
    PublishedAt: string;
    Source: BreachSource;
    /* Number of records exposed in the breach, rounded; we recommend to display this number in a user-friendly way, using user's locale (i.e. 120M in english) */
    Size?: number | null;
    /* List of data (fields) exposed in the breach */
    ExposedData: BreachString[];
    /* Few last characters of the exposed password, if it was plaintext */
    PasswordLastChars?: string | null;
    /* Recommended actions to take */
    Actions: BreachAction[];
};
export type BreachSample = {
    ID: Id;
    /* User's email formatted exactly how it appeared in the breach */
    Email: string;
    ResolvedState: BreachAlertState2;
    /* Severity of the breach expressed as a number on a scale 0.0 -> 1.0; this way we can easily add new severities in the future; for now, interpret in a following way: low: 0.00 <= severity < 0.33, medium: 0.33 <= severity < 0.67, high: 0.67 <= severity <= 1.00 */
    Severity: number;
    /* Translated breach name */
    Name: string;
    /* Date & time when we imported this breach, ISO 8601 */
    CreatedAt: string;
    Source: BreachSource;
};
export type SlPendingAliasResponse = {
    /* ID of the PendingAlias */
    PendingAliasID: string;
    /* Email of the PendingAlias */
    AliasEmail: string;
    /* Note of the PendingAlias */
    AliasNote: string;
};
export type BreachDomainPeekResponse = {
    /* Domain that has a breach */
    Domain: string;
    /* Time when we were aware of this breach */
    BreachTime: number;
};
export type BreachAddressGetResponse = {
    /* Id of the address that has a breach */
    AddressID: string;
    /* Email of the address */
    Email: string;
    /* Flags for this address:<ul><li>1 << 0 (1): Disabled monitoring</li></ul> */
    Flags: number;
    /* Number of breaches this custom email appears in */
    BreachCounter: number;
    /* Last breach time if there has been a breach */
    LastBreachTime?: number | null;
};
export type CustomDomainMailboxOutput = {
    /* ID of the mailbox */
    ID: number;
    /* Email address of the mailbox */
    Email: string;
};
export type InviteDataForUser = {
    /* InviteToken */
    InviteToken: string;
    /* Number of reminders sent */
    RemindersSent: number;
    /* Type of target for this invite */
    TargetType: number;
    /* TargetID for this invite */
    TargetID: string;
    /* Email of the inviter */
    InviterEmail: string;
    /* Invited email */
    InvitedEmail: string;
    /* Invited AddressID */
    InvitedAddressID: string;
    /* Share keys encrypted for the address key of the invitee and signed with the user keys of the inviter */
    Keys: KeyRotationKeyPair[];
    VaultData: InviteVaultDataForUser;
    /* Base64 encrypted invite data */
    Data?: string | null;
    /* True if the invite comes from a NewUserInvite */
    FromNewUser: boolean;
    /* Creation time for the invite */
    CreateTime: number;
};
export type ItemRevisionResponse = {
    /* Item ID */
    ItemID: string;
    /* Latest item revision */
    Revision: number;
    /* Revision state. Values: 1 = Active, 2 = Trashed */
    State: number;
    /* Flags for this item */
    Flags: number;
    /* Time of the last item modification */
    ModifyTime: number;
    /* Creation time of this revision */
    RevisionTime: number;
};
export type ItemFileChunkOutput = {
    ChunkID: Id;
    /* Chunk index. Used to restore the file chunks in order */
    Index: number;
    /* Chunk size in bytes */
    Size: number;
};
export type PendingShareKeyGetResponse = {
    /* Pending share key ID */
    PendingShareKeyID: string;
    /* AddressID for this pending share key */
    AddressID: string;
    /* AddressID that did the key rotation. Should be signing this key. */
    RotatorAddressID: string;
    /* Key rotation for this pending share key */
    KeyRotation: number;
    /* Base64 encoded encrypted shake key for this address */
    EncryptedKey: string;
};
export type InAppNotification = {
    /* ID for this notification. Used to dismiss it */
    ID: string;
    /* Notification key used for telemetry */
    NotificationKey: string;
    /* Timestamp that states when the notification should be shown */
    StartTime: number;
    /* Optional timestamp that states when the notification should not be shown any more */
    EndTime?: number | null;
    State: InAppNotificationState;
    /* Notification priority. The higher, the most important */
    Priority: number;
    Content: InAppNotificationContent;
};
export type OrganizationSettingsGetResponse = {
    /* Bitfield with allowed ways to share within the organization. 0 means unrestricted, 1 means sharing is only allowed within the organization */
    ShareMode: number;
    /* Bitfield with allowed ways to accept invites outside the organization. 0 means unrestricted, 1 means only admins can accept invites from ouside the org */
    ShareAcceptMode: number;
    /* Is item sharing enabled. 0 means no, 1 yes */
    ItemShareMode: number;
    /* Are secure links enabled. 0 means no, 1 yes */
    PublicLinkMode: number;
    /* Force seconds to lock pass. 0 means lock time is not enforced */
    ForceLockSeconds: number;
    /* Bitfield with allowed ways to export data. 0 means anyone can export. 1 means only admins can export data */
    ExportMode: number;
    /* Organization password policy */
    PasswordPolicy?: OrganizationUpdatePasswordPolicyRequest | null;
    /* Bitfield with who can create vaults. 0 means anyone, 1 means only admins can create vaults */
    VaultCreateMode: number;
};
export type MemberMonitorReport = {
    /* Primary email for this member */
    PrimaryEmail: string;
    CustomEmailBreachCount: BreachMonitorCounter;
    AddressBreachCount: BreachMonitorCounter;
    ItemsReport: OrgMemberVaultItemReport;
    /* Pass Monitor report. Will be null if there is no report stored. */
    MonitorReport?: UserMonitorReport | null;
    /* Last activity from the member. Null if the user has not actively done anything */
    LastActivityTime?: number | null;
};
export type ItemIDLastUseTime = {
    /* Item ID */
    ItemID: string;
    /* Last use time for this item */
    LastUseTime: number;
};
export type VaultInviteData = {
    /* InviteID */
    InviteID: string;
    /* Email of the invited user */
    InvitedEmail: string;
    /* Email of the user who created the invite */
    InviterEmail: string;
    /* Share role for this invite */
    ShareRoleID: string;
    /* Target type for the invite */
    TargetType: number;
    /* Target ID for the invite */
    TargetID: string;
    /* Number of reminders sent to the invited user */
    RemindersSent: number;
    /* Creation time for the invite */
    CreateTime: number;
    /* Modify time for the invite */
    ModifyTime: number;
};
export type NewUserInviteGetResponse = {
    /* ID of the invite */
    NewUserInviteID: string;
    /* State of the invite. <ul><li>1 - Waiting for user creation.</li><li>2 - User has been created and invite can be created</li></ul> */
    State: number;
    /* Type of target for this invite */
    TargetType: number;
    /* TargetID for this invite */
    TargetID: string;
    /* Share role for this invite */
    ShareRoleID: string;
    /* Invited email */
    InvitedEmail: string;
    /* Email of the inviter */
    InviterEmail: string;
    /* Base64 encoded signature with the inviter email address keys */
    Signature: string;
    /* Creation time for the invite */
    CreateTime: number;
    /* Last modification time for the invite */
    ModifyTime: number;
};
export type MissingAliasDto = {
    /* Email of the alias */
    Email: string;
    /* Email note as stored in SL */
    Note: string;
};
export type UserAliasDomainOutput = {
    /* Domain name */
    Domain: string;
    /* If the domain is a custom one made by the user */
    IsCustom: boolean;
    /* Whether the domain is only available to premium users */
    IsPremium: boolean;
    /* Whether the domain has the proper MX records */
    MXVerified: boolean;
    /* Whether the domain is the default one when creating an alias */
    IsDefault: boolean;
};
export type PassPlanResponse = {
    Type: PlanType;
    /* Internal name of the plan */
    InternalName: string;
    /* Display name of the plan */
    DisplayName: string;
    /* Whether this user can manage the plan */
    ManageSubscription: boolean;
    /* If this user has a paid plan when does the subscription end */
    SubscriptionEnd?: number | null;
    /* If this user has a plaid plan and the plan is set to auto-renew */
    SubscriptionRenewal: boolean;
    /* Coupon used for this subscription if any was used */
    SubscriptionCoupon?: string | null;
    /* If the user used an offer, what offer was that */
    SubscriptionOffer?: string | null;
    /* Force hide the upgrade button independently of plan */
    HideUpgrade: boolean;
    /* If the user is in trial show when the trial ends. Otherwise it sill be null */
    TrialEnd?: number | null;
    /* Vault limit, null for plans with Pass plus */
    VaultLimit?: number | null;
    /* Alias limit, null for plans with Pass plus */
    AliasLimit?: number | null;
    /* TOTP limit, null for plans with Pass plus */
    TotpLimit?: number | null;
    /* Whether this account can manage alias configuration */
    ManageAlias: boolean;
    /* Whether this account can use file attachments */
    StorageAllowed: boolean;
    /* Max allowed upload size in bytes of files */
    StorageMaxFileSize: number;
    /* What is the storage usage for this user */
    StorageUsed: number;
    /* What is the storage quota for this user */
    StorageQuota: number;
};
export type UserDataResponse = {
    /* Default share to user for this user. Null if not set any default share */
    DefaultShareID?: string | null;
    /* Alias sync enabled */
    AliasSyncEnabled: boolean;
    /* How many alias are waiting to be synced */
    PendingAliasToSync: number;
};
export type SyncEventShareItemOutput = { ShareID: Id; ItemID: Id; EventToken: Id };
export type SyncEventShareOutput = { ShareID: Id; EventToken: Id };
export enum BreachAlertState {
    UNREAD = 1,
    READ = 2,
    RESOLVED = 3,
}
export type BreachSource = {
    /* Whether the breach is aggregated data from multiple sources or data from a single source */
    IsAggregated: boolean;
    /* Domain name (DNS) of the source of the breach, if known */
    Domain?: string | null;
    /* Breach category, if known; values are dynamic and can change over time */
    Category?: BreachString | null;
    /* Country to which source of the breach is associated, if known */
    Country?: BreachCountry | null;
};
export type BreachString = {
    /* Original value, keyword, token, ... */
    Code: string;
    /* Localized name or description of the value */
    Name: string;
    /* The leaked value */
    Values?: string[];
};
export type BreachAction = {
    /* Unique identifier of the action. Possible values are: <ul><li>stay_alert: No special action required</li><li>password_exposed: Plaintext password leaked. User needs to change the password</li><li>password_source: hashed password exposed. User would better change the password</li><li>passwords_all: all hashed passwords leaked for a site. Recommendation for a paranoid person would be to change all passwords everywhere</li><li>2fa: Recommended to enable 2fa</li><li>aliases: Use an alias instead of your email address</li></ul> */
    Code: string;
    /* Translated name of the action to take */
    Name: string;
    /* Further information about how to take the action */
    Desc: string;
    /* List of URLs used to build clickable links in the description. */
    Urls?: string[];
};
export enum BreachAlertState2 {
    UNREAD = 1,
    READ = 2,
    RESOLVED = 3,
}
export type InviteVaultDataForUser = {
    /* Base64 encoded content of the share. Only shown if it a vault share */
    Content: string;
    /* Key rotation that should be used to open the content */
    ContentKeyRotation: number;
    /* Content format version */
    ContentFormatVersion: number;
    /* Number of members that have access to this vault */
    MemberCount: number;
    /* Number of items in this vault */
    ItemCount: number;
};
export type InAppNotificationContent = {
    /* Optional URL of the image to be shown */
    ImageUrl?: string | null;
    DisplayType: InAppNotificationDisplayType;
    /* Translated title of the notification */
    Title: string;
    /* Translated message of the notification */
    Message: string;
    /* Theme of the notification */
    Theme?: string | null;
    /* CTA of the notification */
    Cta?: InAppNotificationCta | null;
};
export type BreachMonitorCounter = {
    /* Number of emails monitored */
    BreachEmailCount: number;
    /* Number of breaches for all the emails monitored */
    TotalBreachCount: number;
};
export type OrgMemberVaultItemReport = {
    OwnedVaultCount?: number;
    OwnedItemCount?: number;
    AccessibleItemCount?: number;
    AccessibleVaultCount?: number;
};
export type UserMonitorReport = {
    UserID: string;
    OrganizationID: number;
    ReusedPasswords: number;
    Inactive2FA: number;
    ExcludedItems: number;
    WeakPasswords: number;
    ReportTime: number;
    ClientVersion: string;
};
export enum PlanType {
    FREE = 'free',
    PLUS = 'plus',
    BUSINESS = 'business',
}
export type BreachCountry = {
    /* ISO 3166 alpha 2 country code */
    Code: string;
    /* Localized country name */
    Name: string;
    /* Emoji flag of the country */
    FlagEmoji: string;
};
export enum InAppNotificationDisplayType {
    BANNER = 0,
    MODAL = 1,
}
export type InAppNotificationCta = {
    /* Text of the CTA */
    Text: string;
    Type: InAppNotificationCtaType;
    /* Destination of the CTA. If type=external_link, it's a URL. If type=internal_navigation, it's a deeplink */
    Ref: string;
};
export enum InAppNotificationCtaType {
    INTERNAL_NAVIGATION = 'internal_navigation',
    EXTERNAL_LINK = 'external_link',
}
export type ApiResponse<Path extends string, Method extends string> =
    Path extends `pass/v1/share/${string}/item/${string}/file/${string}/chunk/${string}` ?
        Method extends `get` ?
            string
        :   never
    : Path extends `pass/v1/share/${string}/alias/${string}/breaches/${string}/resolve` ?
        Method extends `post` ?
            { Code: ResponseCodeSuccess }
        :   never
    : Path extends `pass/v1/share/${string}/alias/${string}/contact/${string}/blocked` ?
        Method extends `put` ?
            { Code: ResponseCodeSuccess; Contact: AliasContactGetResponse }
        :   never
    : Path extends `pass/v1/share/${string}/item/${string}/file/${string}/metadata` ?
        Method extends `put` ?
            { Code: ResponseCodeSuccess; File: ItemFileOutput }
        :   never
    : Path extends `pass/v1/share/${string}/item/${string}/file/${string}/restore` ?
        Method extends `post` ?
            { Code: ResponseCodeSuccess; Result: ItemFileRestoreResponse }
        :   never
    : Path extends `pass/v1/user/alias/custom_domain/${string}/settings/catch_all` ?
        Method extends `put` ?
            { Code: ResponseCodeSuccess; Settings: CustomDomainSettingsOutput }
        :   never
    : Path extends `pass/v1/user/alias/custom_domain/${string}/settings/mailboxes` ?
        Method extends `put` ?
            { Code: ResponseCodeSuccess; Settings: CustomDomainSettingsOutput }
        :   never
    : Path extends `pass/v1/user/alias/custom_domain/${string}/settings/name` ?
        Method extends `put` ?
            { Code: ResponseCodeSuccess; Settings: CustomDomainSettingsOutput }
        :   never
    : Path extends `pass/v1/user/alias/custom_domain/${string}/settings/random_prefix` ?
        Method extends `put` ?
            { Code: ResponseCodeSuccess; Settings: CustomDomainSettingsOutput }
        :   never
    : Path extends `pass/v1/breach/custom_email/${string}/breaches/${string}/resolve` ?
        Method extends `put` ?
            { Code: ResponseCodeSuccess }
        :   never
    : Path extends `pass/v1/share/${string}/invite/new_user/${string}/keys` ?
        Method extends `post` ?
            { Code: ResponseCodeSuccess }
        :   never
    : Path extends `pass/v1/share/${string}/alias/${string}/breaches/resolved` ?
        Method extends `post` ?
            { Code: ResponseCodeSuccess }
        :   never
    : Path extends `pass/v1/share/${string}/item/${string}/file/restore` ?
        Method extends `post` ?
            { Code: ResponseCodeSuccess; Result: ItemFileRestoreBatchResponse }
        :   never
    : Path extends `pass/v1/share/${string}/item/${string}/key/latest` ?
        Method extends `get` ?
            { Code: ResponseCodeSuccess; Key: ItemLatestKeyResponse }
        :   never
    : Path extends `pass/v1/share/${string}/item/${string}/revisions/files` ?
        Method extends `get` ?
            { Code: ResponseCodeSuccess; Files: ItemFilesOutput }
        :   never
    : Path extends `pass/v1/share/${string}/alias/${string}/contact/${string}` ?
        Method extends `get` ? { Code: ResponseCodeSuccess; Contact: AliasContactWithStatsGetResponse }
        : Method extends `delete` ? { Code: ResponseCodeSuccess }
        : never
    : Path extends `pass/v1/user/alias/custom_domain/${string}/settings` ?
        Method extends `get` ?
            { Code: ResponseCodeSuccess; Settings: CustomDomainSettingsOutput }
        :   never
    : Path extends `pass/v1/user/alias/mailbox/${string}/email` ?
        Method extends `put` ? { Code: ResponseCodeSuccess; Mailbox: UserMailboxOutput }
        : Method extends `delete` ? SuccessfulResponse
        : never
    : Path extends `pass/v1/user/alias/mailbox/${string}/verify` ?
        Method extends `get` ? { Code: ResponseCodeSuccess; Mailbox: UserMailboxOutput }
        : Method extends `post` ? { Code: ResponseCodeSuccess; Mailbox: UserMailboxOutput }
        : never
    : Path extends `pass/v1/public_link/files/${string}/${string}/${string}` ?
        Method extends `get` ?
            string
        :   never
    : Path extends `pass/v1/share/${string}/invite/new_user/batch` ?
        Method extends `post` ?
            { Code: ResponseCodeSuccess }
        :   never
    : Path extends `pass/v1/share/${string}/item/import/batch` ?
        Method extends `post` ?
            { Code: ResponseCodeSuccess; Revisions: ItemRevisionListResponse }
        :   never
    : Path extends `pass/v1/share/${string}/invite/new_user/${string}` ?
        Method extends `delete` ?
            { Code: ResponseCodeSuccess }
        :   never
    : Path extends `pass/v1/share/${string}/user/item/${string}` ?
        Method extends `get` ?
            ActiveSharesInVaultGetResponse & { Code: ResponseCodeSuccess }
        :   never
    : Path extends `pass/v1/share/${string}/alias/${string}/breaches` ?
        Method extends `get` ?
            { Code: ResponseCodeSuccess; Breaches: BreachesResponse }
        :   never
    : Path extends `pass/v1/share/${string}/alias/${string}/contact` ?
        Method extends `get` ? AliasContactListResponse & { Code: ResponseCodeSuccess }
        : Method extends `post` ? { Code: ResponseCodeSuccess; Contact: AliasContactGetResponse }
        : never
    : Path extends `pass/v1/share/${string}/alias/${string}/mailbox` ?
        Method extends `post` ?
            { Code: ResponseCodeSuccess; Item: AliasDetailsResponse }
        :   never
    : Path extends `pass/v1/share/${string}/alias/${string}/name` ?
        Method extends `put` ?
            { Code: ResponseCodeSuccess }
        :   never
    : Path extends `pass/v1/share/${string}/alias/${string}/note` ?
        Method extends `put` ?
            { Code: ResponseCodeSuccess }
        :   never
    : Path extends `pass/v1/share/${string}/alias/${string}/status` ?
        Method extends `put` ?
            { Code: ResponseCodeSuccess; Item: ItemRevisionContentsResponse }
        :   never
    : Path extends `pass/v1/share/${string}/invite/${string}/reminder` ?
        Method extends `post` ?
            { Code: ResponseCodeSuccess }
        :   never
    : Path extends `pass/v1/share/${string}/item/${string}/files` ?
        Method extends `get` ?
            { Code: ResponseCodeSuccess; Files: ItemFilesOutput }
        :   never
    : Path extends `pass/v1/share/${string}/item/${string}/flags` ?
        Method extends `put` ?
            { Code: ResponseCodeSuccess; Item: ItemRevisionContentsResponse }
        :   never
    : Path extends `pass/v1/share/${string}/item/${string}/key` ?
        Method extends `get` ?
            { Code: ResponseCodeSuccess; Keys: ItemGetKeysResponse }
        :   never
    : Path extends `pass/v1/share/${string}/item/${string}/lastuse` ?
        Method extends `put` ?
            { Code: ResponseCodeSuccess; Revision: ItemRevisionContentsResponse }
        :   never
    : Path extends `pass/v1/share/${string}/item/${string}/link_files` ?
        Method extends `post` ?
            { Code: ResponseCodeSuccess; Item: ItemRevisionContentsResponse }
        :   never
    : Path extends `pass/v1/share/${string}/item/${string}/pin` ?
        Method extends `post` ? { Code: ResponseCodeSuccess; Item: ItemRevisionContentsResponse }
        : Method extends `delete` ? { Code: ResponseCodeSuccess; Item: ItemRevisionContentsResponse }
        : never
    : Path extends `pass/v1/share/${string}/item/${string}/public_link` ?
        Method extends `post` ?
            { Code: ResponseCodeSuccess; PublicLink: PublicLinkCreateResponse }
        :   never
    : Path extends `pass/v1/share/${string}/item/${string}/revision` ?
        Method extends `get` ?
            { Code: ResponseCodeSuccess; Revisions: ItemRevisionListResponse }
        :   never
    : Path extends `pass/v1/share/${string}/item/${string}/revisions` ?
        Method extends `delete` ?
            { Code: ResponseCodeSuccess; Item: ItemRevisionContentsResponse }
        :   never
    : Path extends `pass/v1/share/${string}/item/${string}/share` ?
        Method extends `put` ?
            { Code: ResponseCodeSuccess; Item: ItemRevisionContentsResponse }
        :   never
    : Path extends `pass/v1/user/alias/settings/default_alias_domain` ?
        Method extends `put` ?
            { Code: ResponseCodeSuccess; Settings: UserAliasSettingsGetOutput }
        :   never
    : Path extends `pass/v1/user/alias/settings/default_mailbox_id` ?
        Method extends `put` ?
            { Code: ResponseCodeSuccess; Settings: UserAliasSettingsGetOutput }
        :   never
    : Path extends `pass/v1/user/session/lock/check` ?
        Method extends `get` ?
            { Code: ResponseCodeSuccess; LockInfo: SessionLockCheckExistsResponse }
        :   never
    : Path extends `pass/v1/user/session/lock/force_lock` ?
        Method extends `post` ?
            { Code: ResponseCodeSuccess }
        :   never
    : Path extends `pass/v1/user/session/lock/unlock` ?
        Method extends `post` ?
            { Code: ResponseCodeSuccess; LockData: SessionLockStorageTokenResponse }
        :   never
    : Path extends `pass/v1/user/alias/custom_domain/${string}` ?
        Method extends `get` ? { Code: ResponseCodeSuccess; CustomDomain: CustomDomainOutput }
        : Method extends `post` ? { Code: ResponseCodeSuccess; CustomDomainValidation: CustomDomainValidationOutput }
        : Method extends `delete` ? { Code: ResponseCodeSuccess }
        : never
    : Path extends `pass/v1/user/alias/mailbox/${string}` ?
        Method extends `delete` ?
            SuccessfulResponse
        :   never
    : Path extends `pass/v1/alias_sync/share/${string}/create` ?
        Method extends `post` ?
            { Code: ResponseCodeSuccess; Revisions: ItemRevisionListResponse }
        :   never
    : Path extends `pass/v1/breach/address/${string}/breaches` ?
        Method extends `get` ?
            { Code: ResponseCodeSuccess; Breaches: BreachesResponse }
        :   never
    : Path extends `pass/v1/breach/address/${string}/monitor` ?
        Method extends `put` ?
            { Code: ResponseCodeSuccess }
        :   never
    : Path extends `pass/v1/breach/address/${string}/resolved` ?
        Method extends `post` ?
            { Code: ResponseCodeSuccess }
        :   never
    : Path extends `pass/v1/breach/custom_email/${string}/breaches` ?
        Method extends `get` ?
            { Code: ResponseCodeSuccess; Breaches: BreachesResponse }
        :   never
    : Path extends `pass/v1/breach/custom_email/${string}/monitor` ?
        Method extends `put` ?
            { Code: ResponseCodeSuccess; Email: BreachCustomEmailGetResponse }
        :   never
    : Path extends `pass/v1/breach/custom_email/${string}/resend_verification` ?
        Method extends `post` ?
            { Code: ResponseCodeSuccess }
        :   never
    : Path extends `pass/v1/breach/custom_email/${string}/resolved` ?
        Method extends `put` ?
            { Code: ResponseCodeSuccess; Email: BreachCustomEmailGetResponse }
        :   never
    : Path extends `pass/v1/breach/custom_email/${string}/verify` ?
        Method extends `put` ?
            { Code: ResponseCodeSuccess; Email: BreachCustomEmailGetResponse }
        :   never
    : Path extends `pass/v1/share/${string}/alias/custom` ?
        Method extends `post` ?
            { Code: ResponseCodeSuccess; Item: ItemRevisionContentsResponse }
        :   never
    : Path extends `pass/v1/share/${string}/alias/options` ?
        Method extends `get` ?
            { Code: ResponseCodeSuccess; Options: AliasOptionsResponse }
        :   never
    : Path extends `pass/v1/share/${string}/alias/random` ?
        Method extends `post` ?
            { Code: ResponseCodeSuccess; Item: ItemRevisionContentsResponse }
        :   never
    : Path extends `pass/v1/share/${string}/invite/batch` ?
        Method extends `post` ?
            { Code: ResponseCodeSuccess }
        :   never
    : Path extends `pass/v1/share/${string}/invite/check_address` ?
        Method extends `post` ?
            CheckAddressForInviteRequest & { Code: ResponseCodeSuccess }
        :   never
    : Path extends `pass/v1/share/${string}/invite/new_user` ?
        Method extends `post` ?
            { Code: ResponseCodeSuccess }
        :   never
    : Path extends `pass/v1/share/${string}/invite/recommended_emails` ?
        Method extends `get` ?
            { Code: ResponseCodeSuccess; Recommendation: InviteRecommendationsResponse }
        :   never
    : Path extends `pass/v1/share/${string}/item/read` ?
        Method extends `put` ?
            { Code: ResponseCodeSuccess }
        :   never
    : Path extends `pass/v1/share/${string}/item/share` ?
        Method extends `put` ?
            ItemMoveMultipleResponse & { Code: ResponseCodeSuccess }
        :   never
    : Path extends `pass/v1/share/${string}/item/trash` ?
        Method extends `post` ?
            ItemTrashResponse & { Code: ResponseCodeSuccess }
        :   never
    : Path extends `pass/v1/share/${string}/item/untrash` ?
        Method extends `post` ?
            ItemTrashResponse & { Code: ResponseCodeSuccess }
        :   never
    : Path extends `pass/v1/share/${string}/item/with_alias` ?
        Method extends `post` ?
            { Code: ResponseCodeSuccess; Bundle: AliasAndItemResponse }
        :   never
    : Path extends `pass/v1/share/${string}/key/pending` ?
        Method extends `get` ? { Code: ResponseCodeSuccess; PendingShareKeys: PendingShareKeysListResponse }
        : Method extends `post` ? { Code: ResponseCodeSuccess; ShareKeys: ShareKeysResponse }
        : never
    : Path extends `pass/v1/share/${string}/alias/${string}` ?
        Method extends `get` ?
            { Code: ResponseCodeSuccess; Alias: AliasDetailsResponse }
        :   never
    : Path extends `pass/v1/share/${string}/event/${string}` ?
        Method extends `get` ?
            { Code: ResponseCodeSuccess; Events: PassEventListResponse }
        :   never
    : Path extends `pass/v1/share/${string}/invite/${string}` ?
        Method extends `delete` ?
            { Code: ResponseCodeSuccess }
        :   never
    : Path extends `pass/v1/share/${string}/item/${string}` ?
        Method extends `get` ? { Code: ResponseCodeSuccess; Item: ItemRevisionContentsResponse }
        : Method extends `put` ? { Code: ResponseCodeSuccess; Item: ItemRevisionContentsResponse }
        : never
    : Path extends `pass/v1/share/${string}/user/${string}` ?
        Method extends `get` ? { Code: ResponseCodeSuccess; Share: ActiveShareGetResponse }
        : Method extends `put` ? { Code: ResponseCodeSuccess }
        : Method extends `delete` ? { Code: ResponseCodeSuccess }
        : never
    : Path extends `pass/v1/organization/report/client_data` ?
        Method extends `post` ?
            { Code: ResponseCodeSuccess }
        :   never
    : Path extends `pass/v1/organization/settings/password_policy` ?
        Method extends `put` ?
            { Code: ResponseCodeSuccess; Organization?: OrganizationGetResponse | null }
        :   never
    : Path extends `pass/v1/user/access/check` ?
        Method extends `get` ?
            { Code: ResponseCodeSuccess; Data?: UserAccessCheckGetResponse | null }
        :   never
    : Path extends `pass/v1/user/alias/count` ?
        Method extends `get` ?
            { Code: ResponseCodeSuccess; AliasCount: UserAliasCountResponse }
        :   never
    : Path extends `pass/v1/user/alias/custom_domain` ?
        Method extends `get` ? { Code: ResponseCodeSuccess; CustomDomains: CustomDomainsListOutput }
        : Method extends `post` ? { Code: ResponseCodeSuccess; CustomDomain: CustomDomainOutput }
        : never
    : Path extends `pass/v1/user/alias/domain` ?
        Method extends `get` ?
            UserAliasDomainListOutput & { Code: ResponseCodeSuccess }
        :   never
    : Path extends `pass/v1/user/alias/mailbox` ?
        Method extends `get` ? UserMailboxListOutput & { Code: ResponseCodeSuccess }
        : Method extends `post` ? { Code: ResponseCodeSuccess; Mailbox: UserMailboxOutput }
        : never
    : Path extends `pass/v1/user/alias/missing` ?
        Method extends `get` ?
            GetMissingAliasResponse & { Code: ResponseCodeSuccess }
        :   never
    : Path extends `pass/v1/user/alias/settings` ?
        Method extends `get` ?
            { Code: ResponseCodeSuccess; Settings?: UserAliasSettingsGetOutput | null }
        :   never
    : Path extends `pass/v1/user/coupon/redeem` ?
        Method extends `post` ?
            { Code: ResponseCodeSuccess }
        :   never
    : Path extends `pass/v1/user/session/lock` ?
        Method extends `post` ? { Code: ResponseCodeSuccess; LockData: SessionLockStorageTokenResponse }
        : Method extends `delete` ? { Code: ResponseCodeSuccess; LockData: SessionLockStorageTokenResponse }
        : never
    : Path extends `pass/v1/user/srp/auth` ?
        Method extends `post` ?
            { Code: ResponseCodeSuccess }
        :   never
    : Path extends `pass/v1/user/srp/info` ?
        Method extends `get` ?
            { Code: ResponseCodeSuccess; SRPData: SRPGetOutput }
        :   never
    : Path extends `pass/v1/breach/custom_email/${string}` ?
        Method extends `delete` ?
            { Code: ResponseCodeSuccess }
        :   never
    : Path extends `pass/v1/public_link/content/${string}` ?
        Method extends `get` ?
            { Code: ResponseCodeSuccess; PublicLinkContent: PublicLinkGetContentResponse }
        :   never
    : Path extends `pass/v1/public_link/files/${string}` ?
        Method extends `get` ?
            { Code: ResponseCodeSuccess; Files: ItemFilesOutput }
        :   never
    : Path extends `pass/v1/user/default_share/${string}` ?
        Method extends `put` ?
            { Code: ResponseCodeSuccess }
        :   never
    : Path extends `pass/v1/user/sync_event/${string}` ?
        Method extends `get` ?
            { Code: ResponseCodeSuccess; Events: SyncEventListOutput }
        :   never
    : Path extends `pass/v1/vault/share/${string}` ?
        Method extends `get` ?
            { Code: ResponseCodeSuccess; Share?: ShareGetResponse | null }
        :   never
    : Path extends `pass/v1/file/${string}/chunk` ?
        Method extends `post` ?
            { Code: ResponseCodeSuccess }
        :   never
    : Path extends `pass/v1/file/${string}/metadata` ?
        Method extends `put` ?
            { Code: ResponseCodeSuccess; File: CreatePendingFileOutput }
        :   never
    : Path extends `pass/v1/share/${string}/event` ?
        Method extends `get` ?
            EventIDGetResponse & { Code: ResponseCodeSuccess }
        :   never
    : Path extends `pass/v1/share/${string}/invite` ?
        Method extends `get` ? InvitesForVaultGetResponse & { Code: ResponseCodeSuccess }
        : Method extends `post` ? { Code: ResponseCodeSuccess }
        : never
    : Path extends `pass/v1/share/${string}/item` ?
        Method extends `get` ? { Code: ResponseCodeSuccess; Items: ItemRevisionListResponse }
        : Method extends `post` ? { Code: ResponseCodeSuccess; Item: ItemRevisionContentsResponse }
        : Method extends `delete` ? { Code: ResponseCodeSuccess }
        : never
    : Path extends `pass/v1/share/${string}/key` ?
        Method extends `get` ? { Code: ResponseCodeSuccess; ShareKeys: ShareKeysResponse }
        : Method extends `post` ? { Code: ResponseCodeSuccess; ShareKey: ShareKeyResponse }
        : never
    : Path extends `pass/v1/share/${string}/user` ?
        Method extends `get` ?
            ActiveSharesInVaultGetResponse & { Code: ResponseCodeSuccess }
        :   never
    : Path extends `pass/v1/vault/${string}/owner` ?
        Method extends `put` ?
            { Code: ResponseCodeSuccess }
        :   never
    : Path extends `pass/v1/vault/${string}/primary` ?
        Method extends `put` ?
            { Code: ResponseCodeSuccess }
        :   never
    : Path extends `pass/v1/alias_sync/pending` ?
        Method extends `get` ?
            { Code: ResponseCodeSuccess; PendingAliases: SlPendingAliasesResponse }
        :   never
    : Path extends `pass/v1/alias_sync/status` ?
        Method extends `get` ?
            { Code: ResponseCodeSuccess; SyncStatus: SlSyncStatusOutput }
        :   never
    : Path extends `pass/v1/alias_sync/sync` ?
        Method extends `post` ?
            { Code: ResponseCodeSuccess }
        :   never
    : Path extends `pass/v1/breach/custom_email` ?
        Method extends `get` ? { Code: ResponseCodeSuccess; Emails: BreachCustomEmailListResponse }
        : Method extends `post` ? { Code: ResponseCodeSuccess; Email: BreachCustomEmailGetResponse }
        : never
    : Path extends `pass/v1/organization/report` ?
        Method extends `get` ?
            { Code: ResponseCodeSuccess; Report: MemberMonitorReportList }
        :   never
    : Path extends `pass/v1/organization/settings` ?
        Method extends `put` ?
            { Code: ResponseCodeSuccess; Organization?: OrganizationGetResponse | null }
        :   never
    : Path extends `pass/v1/public_link/inactive` ?
        Method extends `delete` ?
            { Code: ResponseCodeSuccess }
        :   never
    : Path extends `pass/v1/user/access` ?
        Method extends `get` ? { Code: ResponseCodeSuccess; Access: UserAccessGetResponse }
        : Method extends `post` ? { Code: ResponseCodeSuccess; Access: UserAccessGetResponse }
        : never
    : Path extends `pass/v1/user/inapp_notifications_disabled` ?
        Method extends `put` ?
            { Code: ResponseCodeSuccess }
        :   never
    : Path extends `pass/v1/user/monitor` ?
        Method extends `put` ?
            { Code: ResponseCodeSuccess; Monitor?: UserMonitorStatusResponse | null }
        :   never
    : Path extends `pass/v1/user/srp` ?
        Method extends `post` ? { Code: ResponseCodeSuccess }
        : Method extends `delete` ? { Code: ResponseCodeSuccess }
        : never
    : Path extends `pass/v1/user/sync_event` ?
        Method extends `get` ?
            EventIDGetResponse & { Code: ResponseCodeSuccess }
        :   never
    : Path extends `pass/v1/invite/${string}` ?
        Method extends `post` ? { Code: ResponseCodeSuccess; Share: ShareGetResponse }
        : Method extends `delete` ? { Code: ResponseCodeSuccess }
        : never
    : Path extends `pass/v1/notification/${string}` ?
        Method extends `put` ?
            { Code: ResponseCodeSuccess }
        :   never
    : Path extends `pass/v1/public_link/${string}` ?
        Method extends `delete` ?
            { Code: ResponseCodeSuccess }
        :   never
    : Path extends `pass/v1/share/${string}` ?
        Method extends `get` ? { Code: ResponseCodeSuccess; Share: ShareGetResponse }
        : Method extends `delete` ? { Code: ResponseCodeSuccess }
        : never
    : Path extends `pass/v1/vault/${string}` ?
        Method extends `put` ? { Code: ResponseCodeSuccess; Share: ShareGetResponse }
        : Method extends `delete` ? { Code: ResponseCodeSuccess }
        : never
    : Path extends `pass/v1/breach` ?
        Method extends `get` ?
            { Code: ResponseCodeSuccess; Breaches: BreachesGetResponse }
        :   never
    : Path extends `pass/v1/file` ?
        Method extends `post` ?
            { Code: ResponseCodeSuccess; File: CreatePendingFileOutput }
        :   never
    : Path extends `pass/v1/invite` ?
        Method extends `get` ?
            InvitesGetResponse & { Code: ResponseCodeSuccess }
        :   never
    : Path extends `pass/v1/notification` ?
        Method extends `get` ?
            { Code: ResponseCodeSuccess; Notifications: UserNotificationList }
        :   never
    : Path extends `pass/v1/organization` ?
        Method extends `get` ?
            { Code: ResponseCodeSuccess; Organization?: OrganizationGetResponse | null }
        :   never
    : Path extends `pass/v1/public_link` ?
        Method extends `get` ?
            { Code: ResponseCodeSuccess; PublicLinks?: PublicLinkGetResponse[] }
        :   never
    : Path extends `pass/v1/share` ?
        Method extends `get` ?
            SharesGetResponse & { Code: ResponseCodeSuccess }
        :   never
    : Path extends `pass/v1/vault` ?
        Method extends `post` ?
            { Code: ResponseCodeSuccess; Share: ShareGetResponse }
        :   never
    :   any;
export type ApiRequestBody<Path extends string, Method extends string> =
    Path extends `pass/v1/share/${string}/alias/${string}/contact/${string}/blocked` ?
        Method extends `put` ?
            AliasContactUpdateBlockedInput
        :   never
    : Path extends `pass/v1/share/${string}/item/${string}/file/${string}/metadata` ?
        Method extends `put` ?
            FileUpdateMetadataInput
        :   never
    : Path extends `pass/v1/share/${string}/item/${string}/file/${string}/restore` ?
        Method extends `post` ?
            FileRestoreInput
        :   never
    : Path extends `pass/v1/user/alias/custom_domain/${string}/settings/catch_all` ?
        Method extends `put` ?
            CustomDomainUpdateCatchAllSettingRequest
        :   never
    : Path extends `pass/v1/user/alias/custom_domain/${string}/settings/mailboxes` ?
        Method extends `put` ?
            CustomDomainUpdateMailboxesSettingRequest
        :   never
    : Path extends `pass/v1/user/alias/custom_domain/${string}/settings/name` ?
        Method extends `put` ?
            CustomDomainUpdateNameSettingRequest
        :   never
    : Path extends `pass/v1/user/alias/custom_domain/${string}/settings/random_prefix` ?
        Method extends `put` ?
            CustomDomainUpdateRandomPrefixGenerationSettingRequest
        :   never
    : Path extends `pass/v1/share/${string}/invite/new_user/${string}/keys` ?
        Method extends `post` ?
            NewUserInvitePromoteRequest
        :   never
    : Path extends `pass/v1/share/${string}/item/${string}/file/restore` ?
        Method extends `post` ?
            FileRestoreBatchInput
        :   never
    : Path extends `pass/v1/user/alias/mailbox/${string}/email` ?
        Method extends `put` ?
            UserMailboxChangeEmailRequest
        :   never
    : Path extends `pass/v1/user/alias/mailbox/${string}/verify` ?
        Method extends `post` ?
            UserMailboxVerifyRequest
        :   never
    : Path extends `pass/v1/share/${string}/invite/new_user/batch` ?
        Method extends `post` ?
            NewUserInviteCreateBatchRequest
        :   never
    : Path extends `pass/v1/share/${string}/item/import/batch` ?
        Method extends `post` ?
            ImportItemBatchRequest
        :   never
    : Path extends `pass/v1/share/${string}/alias/${string}/contact` ?
        Method extends `post` ?
            AliasContactCreateInput
        :   never
    : Path extends `pass/v1/share/${string}/alias/${string}/mailbox` ?
        Method extends `post` ?
            SetAliasMailboxesRequest
        :   never
    : Path extends `pass/v1/share/${string}/alias/${string}/name` ?
        Method extends `put` ?
            AliasUpdateNameRequest
        :   never
    : Path extends `pass/v1/share/${string}/alias/${string}/note` ?
        Method extends `put` ?
            AliasUpdateNoteRequest
        :   never
    : Path extends `pass/v1/share/${string}/alias/${string}/status` ?
        Method extends `put` ?
            AliasUpdateStatusRequest
        :   never
    : Path extends `pass/v1/share/${string}/item/${string}/flags` ?
        Method extends `put` ?
            ItemUpdateFlagsRequest
        :   never
    : Path extends `pass/v1/share/${string}/item/${string}/lastuse` ?
        Method extends `put` ?
            UpdateItemLastUseTimeRequest
        :   never
    : Path extends `pass/v1/share/${string}/item/${string}/link_files` ?
        Method extends `post` ?
            LinkFileToItemInput
        :   never
    : Path extends `pass/v1/share/${string}/item/${string}/public_link` ?
        Method extends `post` ?
            PublicLinkCreateRequest
        :   never
    : Path extends `pass/v1/share/${string}/item/${string}/share` ?
        Method extends `put` ?
            ItemMoveSingleToShareRequest
        :   never
    : Path extends `pass/v1/user/alias/settings/default_alias_domain` ?
        Method extends `put` ?
            UserAliasSettingsDefaultAliasDomainUpdateInput
        :   never
    : Path extends `pass/v1/user/alias/settings/default_mailbox_id` ?
        Method extends `put` ?
            UserAliasSettingsDefaultMailboxIDUpdateIinput
        :   never
    : Path extends `pass/v1/user/session/lock/unlock` ?
        Method extends `post` ?
            UserSessionUnlockRequest
        :   never
    : Path extends `pass/v1/user/alias/mailbox/${string}` ?
        Method extends `delete` ?
            UserMailboxDeleteRequest
        :   never
    : Path extends `pass/v1/alias_sync/share/${string}/create` ?
        Method extends `post` ?
            CreatePendingAliasesRequest
        :   never
    : Path extends `pass/v1/breach/address/${string}/monitor` ?
        Method extends `put` ?
            BreachUpdateMonitorAddressRequest
        :   never
    : Path extends `pass/v1/breach/custom_email/${string}/monitor` ?
        Method extends `put` ?
            BreachUpdateCustomEmailRequest
        :   never
    : Path extends `pass/v1/breach/custom_email/${string}/verify` ?
        Method extends `put` ?
            BreachEmailValidateRequest
        :   never
    : Path extends `pass/v1/share/${string}/alias/custom` ?
        Method extends `post` ?
            CustomAliasCreateRequest
        :   never
    : Path extends `pass/v1/share/${string}/alias/random` ?
        Method extends `post` ?
            ItemCreateRequest
        :   never
    : Path extends `pass/v1/share/${string}/invite/batch` ?
        Method extends `post` ?
            InviteCreateBatchRequest
        :   never
    : Path extends `pass/v1/share/${string}/invite/check_address` ?
        Method extends `post` ?
            CheckAddressForInviteRequest
        :   never
    : Path extends `pass/v1/share/${string}/invite/new_user` ?
        Method extends `post` ?
            NewUserInviteCreateRequest
        :   never
    : Path extends `pass/v1/share/${string}/item/read` ?
        Method extends `put` ?
            ItemMarkAsReadBatchRequest
        :   never
    : Path extends `pass/v1/share/${string}/item/share` ?
        Method extends `put` ?
            ItemMoveMultipleToShareRequest
        :   never
    : Path extends `pass/v1/share/${string}/item/trash` ?
        Method extends `post` ?
            {}
        :   never
    : Path extends `pass/v1/share/${string}/item/untrash` ?
        Method extends `post` ?
            ItemsToTrashRequest
        :   never
    : Path extends `pass/v1/share/${string}/item/with_alias` ?
        Method extends `post` ?
            AliasAndItemCreateRequest
        :   never
    : Path extends `pass/v1/share/${string}/key/pending` ?
        Method extends `post` ?
            PendingShareKeyPromoteRequest
        :   never
    : Path extends `pass/v1/share/${string}/item/${string}` ?
        Method extends `put` ?
            ItemUpdateRequest
        :   never
    : Path extends `pass/v1/share/${string}/user/${string}` ?
        Method extends `put` ?
            ShareUpdateRequest
        :   never
    : Path extends `pass/v1/organization/report/client_data` ?
        Method extends `post` ?
            UserMonitorReportInput
        :   never
    : Path extends `pass/v1/organization/settings/password_policy` ?
        Method extends `put` ?
            OrganizationUpdatePasswordPolicyRequest
        :   never
    : Path extends `pass/v1/user/alias/custom_domain` ?
        Method extends `post` ?
            CustomDomainCreateRequest
        :   never
    : Path extends `pass/v1/user/alias/mailbox` ?
        Method extends `post` ?
            UserMailboxCreateRequest
        :   never
    : Path extends `pass/v1/user/coupon/redeem` ?
        Method extends `post` ?
            UserRedeemCouponInput
        :   never
    : Path extends `pass/v1/user/session/lock` ?
        Method extends `post` ? UserSessionLockRequest
        : Method extends `delete` ? UserSessionUnlockRequest
        : never
    : Path extends `pass/v1/user/srp/auth` ?
        Method extends `post` ?
            SRPAuthRequest
        :   never
    : Path extends `pass/v1/file/${string}/metadata` ?
        Method extends `put` ?
            UpdatePendingFileRequest
        :   never
    : Path extends `pass/v1/share/${string}/invite` ?
        Method extends `post` ?
            InviteCreateRequest
        :   never
    : Path extends `pass/v1/share/${string}/item` ?
        Method extends `post` ? ItemCreateRequest
        : Method extends `delete` ? ItemsToSoftDeleteRequest
        : never
    : Path extends `pass/v1/share/${string}/key` ?
        Method extends `post` ?
            KeyRotationRequest
        :   never
    : Path extends `pass/v1/vault/${string}/owner` ?
        Method extends `put` ?
            VaultTransferOwnershipRequest
        :   never
    : Path extends `pass/v1/alias_sync/sync` ?
        Method extends `post` ?
            EnableSLSyncRequest
        :   never
    : Path extends `pass/v1/breach/custom_email` ?
        Method extends `post` ?
            BreachEmailCreateRequest
        :   never
    : Path extends `pass/v1/organization/settings` ?
        Method extends `put` ?
            OrganizationUpdateSettingsRequest
        :   never
    : Path extends `pass/v1/user/inapp_notifications_disabled` ?
        Method extends `put` ?
            UpdateInAppNotificationsDisabledRequest
        :   never
    : Path extends `pass/v1/user/monitor` ?
        Method extends `put` ?
            UpdateUserMonitorStateRequest
        :   never
    : Path extends `pass/v1/user/srp` ?
        Method extends `post` ?
            AddSRPRequest
        :   never
    : Path extends `pass/v1/invite/${string}` ?
        Method extends `post` ?
            InviteAcceptRequest
        :   never
    : Path extends `pass/v1/notification/${string}` ?
        Method extends `put` ?
            ChangeNotificationStateRequest
        :   never
    : Path extends `pass/v1/vault/${string}` ?
        Method extends `put` ?
            VaultUpdateRequest
        :   never
    : Path extends `pass/v1/file` ?
        Method extends `post` ?
            CreatePendingFileRequest
        :   never
    : Path extends `pass/v1/vault` ?
        Method extends `post` ?
            VaultCreateRequest
        :   never
    :   any;
