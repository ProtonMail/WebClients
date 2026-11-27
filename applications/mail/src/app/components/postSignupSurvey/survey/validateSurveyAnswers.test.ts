import type { Variant } from '../../../api/onboardingSurvey';
import { validateSurveyAnswers } from './validateSurveyAnswers';

const variants: Variant[] = ['T1', 'T2', 'T3', 'T4'];

describe('validateSurveyAnswers', () => {
    it.each(variants)('returns the payload with the %s variant when the answers are complete', (variant) => {
        const answers = {
            JoinReasons: ['private_secure' as const],
            PreviousProviders: ['gmail' as const],
            HeardFrom: 'ai_tools' as const,
        };

        expect(validateSurveyAnswers(variant, answers)).toEqual({ ...answers, Variant: variant });
    });

    it('is invalid without answers', () => {
        expect(validateSurveyAnswers('T1', undefined)).toBeUndefined();
        expect(validateSurveyAnswers('T1', {})).toBeUndefined();
    });

    it('is invalid without a join reason', () => {
        expect(validateSurveyAnswers('T1', { PreviousProviders: ['gmail'] })).toBeUndefined();
        expect(validateSurveyAnswers('T1', { JoinReasons: [], PreviousProviders: ['gmail'] })).toBeUndefined();
    });

    it('is invalid without a previous provider', () => {
        expect(validateSurveyAnswers('T1', { JoinReasons: ['other'] })).toBeUndefined();
        expect(validateSurveyAnswers('T1', { JoinReasons: ['other'], PreviousProviders: [] })).toBeUndefined();
    });
});
