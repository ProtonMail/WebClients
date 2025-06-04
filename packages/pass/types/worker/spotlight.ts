/** WARNING ⚠ : Do not change the order of these enum
 * values as they are referenced by their respective
 * indexes in the spotlight state. */
export enum SpotlightMessage {
    /** Used for custom non-acknowledgable messages */
    NOOP = -1,
    /** Welcome to Proton Pass onboarding */
    WELCOME = 0,
    /** Trial upselling */
    TRIAL = 1,
    /** Ask user to create a lock */
    SECURE_EXTENSION = 2,
    /** Update is available - reload required */
    UPDATE_AVAILABLE = 3,
    /** Permissions grant is insufficient */
    PERMISSIONS_REQUIRED = 4,
    /** Ask user for a rating */
    USER_RATING = 5,
    /** Low disk space */
    STORAGE_ISSUE = 6,
    /** New user waiting for admin confirm */
    PENDING_SHARE_ACCESS = 7,
    /** BF offer discarded */
    BLACK_FRIDAY_OFFER = 8,
    /** B2B onboarding acknowledged */
    B2B_ONBOARDING = 9,
    /** Early access upselling */
    EARLY_ACCESS = 10,
    /** Pass Monitor feature discovery */
    PASS_MONITOR = 11,
    /** Pass Monitor Learn More section state */
    PASS_MONITOR_LEARN_MORE = 12,
    /** Alias trash feature discovery */
    ALIAS_TRASH_CONFIRM = 13,
    /** Promo 2024 */
    FAMILY_PLAN_PROMO_2024 = 14,
    /** Shown if user has pending SL aliases to be sync */
    ALIAS_SYNC_ENABLE = 15,
    /** Plan renewal top-banner */
    USER_RENEWAL = 16,
    /** Enforce SSO lock onboarding */
    SSO_CHANGE_LOCK = 18,
    /** Item sharing feature discovery */
    ITEM_SHARING = 19,
    /** Alias customize (prefix etc.) discovery  */
    ALIAS_DISCOVERY_CUSTOMIZE = 21,
    /** Alias add new mailbox discovery */
    ALIAS_DISCOVERY_MAILBOX = 22,
    /** Alias add new domain discovery */
    ALIAS_DISCOVERY_DOMAIN = 23,
    /** Alias contact discovery */
    ALIAS_DISCOVERY_CONTACT = 24,
    /** File Attachments discovery */
    FILE_ATTACHMENTS_DISCOVERY = 25,
    /** Proton anniversary 2025 promo for web/desktop only */
    PROTON_ANNIVERSARY_2025_PROMO = 26,
    /** Autotype discovery on desktop */
    AUTOTYPE_DISCOVERY = 27,
    /** Autotype confirmation on desktop */
    AUTOTYPE_CONFIRM = 28,
}

export type SpotlightAcknowledgment = {
    message: SpotlightMessage;
    acknowledgedOn: number /* UNIX timestamp for acknowledgment */;
    count: number /* number of acknowledgments for this message */;
    extraData?: any;
};

export type SpotlightState = {
    installedOn: number;
    updatedOn: number;
    acknowledged: SpotlightAcknowledgment[];
};
