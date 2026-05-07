export interface FeedbackDowngradeFormData {
    Reason: string;
    Feedback: string;
    ReasonDetails: string;
    Context: 'vpn' | 'mail';
}

export type KeepSubscription = {
    status: 'kept';
};

export type FeedbackDowngradeResult = FeedbackDowngradeFormData | KeepSubscription;
