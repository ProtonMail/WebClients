import { getListSpotlightStep, getTabSpotlightStep } from './categoriesOnboarding.helpers';
import { OnboardingStep } from './onboardingInterface';

describe('categoriesOnboarding helpers', () => {
    describe('getTabSpotlightStep', () => {
        it('should anchor the message spotlight on the social tab regardless of the categorize location', () => {
            expect(getTabSpotlightStep(OnboardingStep.MESSAGE, 'list')).toBe(OnboardingStep.MESSAGE);
            expect(getTabSpotlightStep(OnboardingStep.MESSAGE, 'tab')).toBe(OnboardingStep.MESSAGE);
            expect(getTabSpotlightStep(OnboardingStep.MESSAGE, undefined)).toBe(OnboardingStep.MESSAGE);
        });

        it('should anchor the free user spotlight on the social tab regardless of the categorize location', () => {
            expect(getTabSpotlightStep(OnboardingStep.FREE_USERS_SPOTLIGHT, 'list')).toBe(
                OnboardingStep.FREE_USERS_SPOTLIGHT
            );
            expect(getTabSpotlightStep(OnboardingStep.FREE_USERS_SPOTLIGHT, 'tab')).toBe(
                OnboardingStep.FREE_USERS_SPOTLIGHT
            );
            expect(getTabSpotlightStep(OnboardingStep.FREE_USERS_SPOTLIGHT, undefined)).toBe(
                OnboardingStep.FREE_USERS_SPOTLIGHT
            );
        });

        it('should anchor the categorize spotlight on the social tab when it was placed on the tab', () => {
            expect(getTabSpotlightStep(OnboardingStep.CATEGORIZE, 'tab')).toBe(OnboardingStep.CATEGORIZE);
        });

        it('should not anchor the categorize spotlight on the tab when it was placed on the list', () => {
            expect(getTabSpotlightStep(OnboardingStep.CATEGORIZE, 'list')).toBeUndefined();
        });

        it('should not anchor the categorize spotlight on the tab when no location has been resolved yet', () => {
            expect(getTabSpotlightStep(OnboardingStep.CATEGORIZE, undefined)).toBeUndefined();
        });

        it('should return undefined for all unsupported steps', () => {
            expect(getTabSpotlightStep(OnboardingStep.NONE, 'tab')).toBeUndefined();
            expect(getTabSpotlightStep(OnboardingStep.INITIAL_MODAL, 'tab')).toBeUndefined();
            expect(getTabSpotlightStep(OnboardingStep.CUSTOMIZE, 'tab')).toBeUndefined();
            expect(getTabSpotlightStep(OnboardingStep.DONE, 'tab')).toBeUndefined();
        });
    });
    describe('getListSpotlightStep', () => {
        it('should anchor the categorize spotlight on the list when it was placed on the list', () => {
            expect(getListSpotlightStep(OnboardingStep.CATEGORIZE, 'list')).toBe(OnboardingStep.CATEGORIZE);
        });

        it('does not anchor the categorize spotlight on the list when it was placed on the tab', () => {
            expect(getListSpotlightStep(OnboardingStep.CATEGORIZE, 'tab')).toBeUndefined();
        });

        it('does not anchor the categorize spotlight on the list when no location has been resolved yet', () => {
            expect(getListSpotlightStep(OnboardingStep.CATEGORIZE, undefined)).toBeUndefined();
        });

        it('should return undefined for all unsupported steps', () => {
            expect(getListSpotlightStep(OnboardingStep.NONE, 'list')).toBeUndefined();
            expect(getListSpotlightStep(OnboardingStep.INITIAL_MODAL, 'list')).toBeUndefined();
            expect(getListSpotlightStep(OnboardingStep.MESSAGE, 'list')).toBeUndefined();
            expect(getListSpotlightStep(OnboardingStep.CUSTOMIZE, 'list')).toBeUndefined();
            expect(getListSpotlightStep(OnboardingStep.FREE_USERS_SPOTLIGHT, 'list')).toBeUndefined();
            expect(getListSpotlightStep(OnboardingStep.DONE, 'list')).toBeUndefined();
        });
    });
});
