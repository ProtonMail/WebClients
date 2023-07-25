export enum OnboardingMessage {
    WELCOME /* welcome to Proton Pass */,
    TRIAL,
    SECURE_EXTENSION /* ask user to create a PIN */,
    UPDATE_AVAILABLE /* update is available - reload required */,
    PERMISSIONS_REQUIRED /* permissions grant is insufficient */,
    USER_RATING /* ask user for a rating */,
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
