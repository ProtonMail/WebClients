// AUTO-GENERATED FILE — DO NOT EDIT BY HAND.
// Source of truth: Chargebee features.
// Regenerate: `yarn workspace @proton/payments generate:entitlement-names`.
// Customize enum keys or descriptions in core/entitlements/scripts/overrides.json.

export enum EntitlementName {
    ActivityMonitorPass = 'activity-monitor-pass',
    ActivityMonitorVpn = 'activity-monitor-vpn',
    AdminRoles = 'admin-roles',
    /** Determines eligibility for breach alerts. */
    BreachAlerts = 'breach-alerts',
    /** Indicates whether this is a business. */
    Business = 'business',
    CatchAll = 'catch-all',
    CustomLogo = 'custom-logo',
    /** Custom Organization logo */
    CustomOrganizationLogo = 'custom-organization-logo',
    CustomOrganizationName = 'custom-organization-name',
    /** Determines whether the plan is eligible for the data retention policy. */
    DataRetentionPolicy = 'data-retention-policy',
    /** Indicates whether external managed members are supported for this plan. */
    ExternalManagedMembers = 'external-managed-members',
    /** Drive features */
    FlagsDrive = 'flags-drive',
    /** Inbox features */
    FlagsInbox = 'flags-inbox',
    /** Lumo features */
    FlagsLumo = 'flags-lumo',
    /** Meet features */
    FlagsMeet = 'flags-meet',
    /** Pass features */
    FlagsPass = 'flags-pass',
    /** VPN features */
    FlagsVpn = 'flags-vpn',
    /** Wallet features */
    FlagsWallet = 'flags-wallet',
    FreeUploadGrowthInitiative = 'free-upload-growth-initiative',
    /** Indicates whether the plan supports full members. */
    FullMembers = 'full-members',
    /** Determines eligibility for the groups feature. */
    Groups = 'groups',
    /** Loyalty Bonus Space for every year of loyalty */
    LoyaltyBonusSpace = 'loyalty-bonus-space',
    /** Indicates whether this plan supports managed members. */
    ManagedMembers = 'managed-members',
    /** The maximum amount of active meetings */
    MaxActiveMeetings = 'max-active-meetings',
    /** Max addresses */
    MaxAddresses = 'max-addresses',
    MaxBookingPages = 'max-booking-pages',
    /** Max calendars */
    MaxCalendars = 'max-calendars',
    /** Max Custom Breach Emails */
    MaxCustomBreachEmails = 'max-custom-breach-emails',
    MaxDedicatedIps = 'max-dedicated-ips',
    /** Max domains */
    MaxDomains = 'max-domains',
    MaxDriveSpace = 'max-drive-space',
    /** The maximum number of emergency contacts a user can have, for emergency access. */
    MaxEmergencyAccessContacts = 'max-emergency-access-contacts',
    /** Max number of users having top priority access to Lumo */
    MaxLumoSeats = 'max-lumo-seats',
    /** The maximum duration of a meeting, in seconds */
    MaxMeetingDuration = 'max-meeting-duration',
    /** The max amount of participants per meeting */
    MaxMeetingParticipants = 'max-meeting-participants',
    /** Max members */
    MaxMembers = 'max-members',
    /** Max Members Subsidiaries */
    MaxMembersSubsidiaries = 'max-members-subsidiaries',
    /** Max number of Revisions that can be kept regardless of age */
    MaxRevisionCount = 'max-revision-count',
    /** Max days Revisions can be kept */
    MaxRevisionDays = 'max-revision-days',
    /** Max scribe */
    MaxScribe = 'max-scribe',
    /** Max space */
    MaxSpace = 'max-space',
    /** Max sub-wallets */
    MaxSubWallets = 'max-sub-wallets',
    /** Max Subsidiaries */
    MaxSubsidiaries = 'max-subsidiaries',
    /** Max Vault Item Shares */
    MaxVaultItemShares = 'max-vault-item-shares',
    /** Max Vault Shares */
    MaxVaultShares = 'max-vault-shares',
    /** Max vaults */
    MaxVaults = 'max-vaults',
    /** Max VPN */
    MaxVpn = 'max-vpn',
    /** Max wallets */
    MaxWallets = 'max-wallets',
    /** If set, the plan has the ability to have multiple users, even if max-users is currently 1 */
    MultiUser = 'multi-user',
    /** Organization Policy toggle for high-paying B2B organizations. */
    OrganizationPolicy = 'organization-policy',
    /** Grants access to paid (Tier 2) VPN servers. */
    PaidVpnServers = 'paid-vpn-servers',
    PassAliasManagement = 'pass-alias-management',
    PassBusiness = 'pass-business',
    PassCli = 'pass-cli',
    /** Plan includes the Pass-specific features that Pass Essentials would grant */
    PassEssentials = 'pass-essentials',
    PassFileUpload = 'pass-file-upload',
    PassFolders = 'pass-folders',
    /** Indicates whether the plan supports private members. */
    PrivateMembers = 'private-members',
    /** Allows users to collaborate with anyone on documents. */
    PublicCollaboration = 'public-collaboration',
    /** Plans available for the referrer in the referral program. */
    ReferralProgram = 'referral-program',
    Sentinel = 'sentinel',
    /** Determines whether SSO is supported. */
    Sso = 'sso',
    /** Determines whether keyless SSO is supported. */
    SsoKeyless = 'sso-keyless',
    SsoKeys = 'sso-keys',
    /** Enables location filtering for VPN (also known as shared servers). */
    VpnLocationFilter = 'vpn-location-filter',
}
