/**
 * State of referred user
 * - `0` => `invited`   : The user has been invited (email invite only)
 * - `1` => `signedup`  : User signed up with the link
 * - `2` => `trial`     : User accepted the free trial
 * - `3` => `completed` : User paid a plus subscription
 * - `4` => `rewarded`  : After some processing reward is given to referrer
 */
export enum ReferralState {
    INVITED = 0,
    SIGNED_UP = 1,
    TRIAL = 2,
    COMPLETED = 3,
    REWARDED = 4,
}

export interface Referral {
    /** Unique id of referred registration/invitation */
    ReferralID: string;
    /**
     * Encrypted id of the Referrer user id
     */
    UserId: string;
    /**
     * Encrypted id of the Referred User id :
     * - `null` if it's an email invitations where the referred user has not yet registered
     */
    ReferredUserID: string | null;
    /** Referral creation time (can be registration time or invitation time for email invitations) */
    CreateTime: number;
    /** not null only for email invitations */
    Email: string | null;
    /** referred user registration time */
    SignupTime: number | null;
    /** when the referred user started its free trial */
    TrialTime: number | null;
    /** when the referral was validated but the referred was already at the maximum allowed reward (or not yet given) */
    CompleteTime: number | null;
    /**  when we gave the reward to the referrer */
    RewardTime: number | null;
    /** The amount of reward amount given to the referrer */
    RewardMonths: number | null;
    State: ReferralState;
    InvoiceID: number | null;
    /** The number of months user subscribed. If monthly will be 1. If yearly will be 12 */
    ReferredUserSubscriptionCycle: number | null;
}

export interface ReferralStatus {
    /** Number of free monthes of mail plus */
    RewardMonths: number;
    /** Max number of free monthes user can have */
    RewardMonthsLimit: number;
    /** Number of emails user can send */
    EmailsAvailable: number;

    /** Number of credits has earned */
    RewardAmount: number;
    /** Max number of credits user can earn */
    RewardAmountLimit: number;
}
