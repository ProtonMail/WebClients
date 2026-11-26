import { getSurveyVariant } from './getSurveyVariant';

describe('getSurveyVariant', () => {
    it.each([
        ['Treatment1', 'T1'],
        ['Treatment2', 'T2'],
        ['Treatment3', 'T3'],
        ['Treatment4', 'T4'],
    ])('maps %s to %s', (name, expected) => {
        expect(getSurveyVariant(name)).toBe(expected);
    });

    it.each(['Control', 'disabled', 'Treatment', 'toString', '', undefined])('has no arm for %s', (name) => {
        expect(getSurveyVariant(name)).toBeUndefined();
    });
});
