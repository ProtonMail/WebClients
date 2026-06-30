import type { PropsWithChildren } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import Spotlight from '@proton/components/components/spotlight/Spotlight';

import { useCategoriesOnboarding } from './CategoriesOnboardingContext';
import { OnboardingStep } from './onboardingInterface';

import './CategoriesOnboardingSpotlights.scss';

interface SpotlightContentProps {
    title: string;
    description: string;
    /** Starts at 0 */
    step: number;
    onSkip: () => void;
    onNext: () => void;
    isLastStep?: boolean;
}

const Circle = () => <div className="categories-onboarding-circle rounded-full border inset-0"></div>;
const Long = () => <div className="categories-onboarding-long rounded-full bg-primary"></div>;

const SpotlightContent = ({ title, description, step, onSkip, onNext, isLastStep = false }: SpotlightContentProps) => {
    return (
        <div>
            <span className="mb-4 flex gap-1">
                {Array.from({ length: 3 }).map((_, i) => (i === step ? <Long key={i} /> : <Circle key={i} />))}
            </span>
            <h2 className="mb-1 text-rg text-semibold">{title}</h2>
            <p className="m-0 mb-4 text-rg color-weak">{description}</p>
            <div className="flex w-full justify-space-between">
                {isLastStep ? (
                    <Button onClick={onNext} color="norm">{c('Actions').t`Got it`}</Button>
                ) : (
                    <>
                        <Button onClick={onNext} color="norm">{c('Actions').t`Next`}</Button>
                        <Button onClick={onSkip} shape="ghost" color="weak">
                            {c('Actions').t`Skip`}
                        </Button>
                    </>
                )}
            </div>
        </div>
    );
};

interface OnboardingSpotlightProps extends PropsWithChildren {
    step: OnboardingStep;
}

export const CategoriesOnboardingSpotlight = ({ step, children }: OnboardingSpotlightProps) => {
    const { handleSkip, completeCurrentStep, activeStep } = useCategoriesOnboarding();

    const getContent = () => {
        if (step === OnboardingStep.MESSAGE) {
            return (
                <SpotlightContent
                    title={c('Title').t`New messages`}
                    description={c('Description')
                        .t`A blue dot appears when a category has unread messages since your last visit. Hover to see the count.`}
                    step={0}
                    onSkip={handleSkip}
                    onNext={() => {
                        completeCurrentStep();
                    }}
                />
            );
        }
        if (step === OnboardingStep.CATEGORIZE) {
            return (
                <SpotlightContent
                    title={c('Title').t`Personalize your Categories`}
                    description={c('Description')
                        .t`Right-click an email and select “Move to,” or drag and drop it into another category. Similar emails will be sorted there automatically in the future.`}
                    step={1}
                    onSkip={handleSkip}
                    onNext={() => {
                        completeCurrentStep();
                    }}
                />
            );
        }

        if (step === OnboardingStep.CUSTOMIZE) {
            return (
                <SpotlightContent
                    title={c('Title').t`You're in control`}
                    description={c('Description')
                        .t`Add or remove categories, manage notifications, or turn them off entirely - anytime in Settings.`}
                    step={2}
                    onSkip={handleSkip}
                    onNext={() => {
                        completeCurrentStep();
                    }}
                    isLastStep
                />
            );
        }
    };

    return (
        <Spotlight
            show={activeStep === step}
            borderRadius="xl"
            hasClose={false}
            innerClassName="p-6"
            content={getContent()}
        >
            <div>{children}</div>
        </Spotlight>
    );
};
