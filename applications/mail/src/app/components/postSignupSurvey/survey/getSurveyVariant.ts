import type { Variant } from '../../../api/onboardingSurvey';

/**
 * Maps the Unleash variant of the user (PostSignupSurveyExperiment) to the arm the API expects.
 * Control, a disabled experiment or an unknown variant have no arm: they never see the survey.
 */
export const getSurveyVariant = (variantName: string | undefined): Variant | undefined => {
    switch (variantName) {
        case 'Treatment1':
            return 'T1';
        case 'Treatment2':
            return 'T2';
        case 'Treatment3':
            return 'T3';
        case 'Treatment4':
            return 'T4';
        default:
            return undefined;
    }
};
