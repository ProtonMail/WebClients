import type { MailDispatch } from '../../../store/store';

export type OnboardingStepEligibleCallback = (dispatch: MailDispatch) => Promise<{
    canDisplay: boolean;
    preload?: string[];
}>;
