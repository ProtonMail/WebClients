import {
    getApertusOnboardingAcceptedAt,
    markApertusOnboardingAccepted,
} from './apertusOnboardingStorage';

describe('apertusOnboardingStorage', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('has no acceptance by default', () => {
        expect(getApertusOnboardingAcceptedAt()).toBeUndefined();
    });

    it('persists the acceptance timestamp', () => {
        markApertusOnboardingAccepted(123);

        expect(getApertusOnboardingAcceptedAt()).toBe(123);
    });
});
