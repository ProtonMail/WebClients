import type { MailDispatch } from 'proton-mail/store/store';

export type OnboardingStepEligibleCallback = (dispatch: MailDispatch) => Promise<{
    canDisplay: boolean;
    preload?: string[];
}>;
