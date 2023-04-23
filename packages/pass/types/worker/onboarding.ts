export enum OnboardingMessage {
    WELCOME /* welcome to Proton Pass */,
    SECURE_EXTENSION /* ask user to create a PIN */,
    UPDATE_AVAILABLE /* update is available - reload required */,
}

export type OnboardingState = {
    installedOn: number;
    updatedOn: number;
    acknowledged: {
        message: OnboardingMessage;
        acknowledgedOn: number /* UNIX timestamp for acknowledgment */;
        count: number /* number of acknowledgments for this message */;
    }[];
};
