export enum OnboardingMessage {
    WELCOME /* welcome to Proton Pass */,
    TRIAL,
    SECURE_EXTENSION /* ask user to create a lock */,
    UPDATE_AVAILABLE /* update is available - reload required */,
    PERMISSIONS_REQUIRED /* permissions grant is insufficient */,
    USER_RATING /* ask user for a rating */,
    STORAGE_ISSUE /* low disk space */,
    PENDING_SHARE_ACCESS /* new user waiting for admin confirm */,
    BLACK_FRIDAY_OFFER,
    B2B_ONBOARDING,
    EARLY_ACCESS,
    PASS_MONITOR,
    PASS_MONITOR_LEARN_MORE,
    ALIAS_TRASH_CONFIRM /* confirm moving an alias to trash and suggest to disable it instead */,
}

export type OnboardingAcknowledgment = {
    message: OnboardingMessage;
    acknowledgedOn: number /* UNIX timestamp for acknowledgment */;
    count: number /* number of acknowledgments for this message */;
    extraData?: any;
};

export type OnboardingState = {
    installedOn: number;
    updatedOn: number;
    acknowledged: OnboardingAcknowledgment[];
};
