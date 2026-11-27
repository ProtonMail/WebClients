import type { OnboardingSurveyPayload, Variant } from '../../../api/onboardingSurvey';

export type OnboardingSurveyAnswers = Partial<Omit<OnboardingSurveyPayload, 'Variant'>>;

/**
 * Checks the answers collected for the arm of the user and returns the payload to submit,
 * or undefined when the answers are not valid for this arm.
 */
export const validateSurveyAnswers = (
    variant: Variant,
    answers: OnboardingSurveyAnswers | undefined
): OnboardingSurveyPayload | undefined => {
    if (!answers) {
        return undefined;
    }

    switch (variant) {
        case 'T1':
        case 'T2':
        case 'T3':
        case 'T4': {
            if (!answers.JoinReasons?.length || !answers.PreviousProviders?.length) {
                return undefined;
            }

            return { ...answers, Variant: variant };
        }
    }
};
