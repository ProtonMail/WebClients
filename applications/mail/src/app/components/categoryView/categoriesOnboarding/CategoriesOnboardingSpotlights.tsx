import type { PropsWithChildren, ReactElement } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import { Href } from '@proton/atoms/Href/Href';
import Spotlight from '@proton/components/components/spotlight/Spotlight';
import useSpotlightShow from '@proton/components/components/spotlight/useSpotlightShow';
import { useAuthentication } from '@proton/components/index';
import { getAppHref } from '@proton/shared/lib/apps/helper';
import { APPS, SECOND } from '@proton/shared/lib/constants';

import { useCategoriesOnboarding } from './CategoriesOnboardingContext';
import { B2C_ONBOARDING_SEQUENCE } from './categoriesOnboarding.helpers';
import { OnboardingStep } from './onboardingInterface';

import './CategoriesOnboardingSpotlights.scss';

const needsWrapper = (children: React.ReactNode): boolean => {
    if (!children || Array.isArray(children)) {
        return true;
    }

    const child = children as ReactElement;
    return typeof child.type !== 'string';
};

interface SpotlightContentProps {
    title: string;
    description: string;
    /** Starts at 0 */
    step: number;
    onSkip: () => void;
    onNext: () => void;
}

const Circle = () => <div className="categories-onboarding-circle rounded-full border inset-0"></div>;
const Long = () => <div className="categories-onboarding-long rounded-full bg-primary"></div>;

const onboardingLength = 3;

const SpotlightContent = ({ title, description, step, onSkip, onNext }: SpotlightContentProps) => {
    const isLastStep = step === onboardingLength - 1;

    return (
        <div>
            <span className="mb-4 flex gap-1">
                {Array.from({ length: onboardingLength }).map((_, i) =>
                    i === step ? <Long key={i} /> : <Circle key={i} />
                )}
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
    const authentication = useAuthentication();
    const { handleSkip, completeCurrentStep, activeStep } = useCategoriesOnboarding();

    const getContent = () => {
        if (step === OnboardingStep.MESSAGE) {
            const step = B2C_ONBOARDING_SEQUENCE.findIndex(({ step }) => step === OnboardingStep.MESSAGE);
            return (
                <SpotlightContent
                    title={c('Title').t`New messages`}
                    description={c('Description')
                        .t`A blue dot appears when a category has unread messages since your last visit.`}
                    step={step - 1}
                    onSkip={handleSkip}
                    onNext={() => {
                        completeCurrentStep();
                    }}
                />
            );
        }
        if (step === OnboardingStep.CATEGORIZE) {
            const step = B2C_ONBOARDING_SEQUENCE.findIndex(({ step }) => step === OnboardingStep.CATEGORIZE);
            return (
                <SpotlightContent
                    title={c('Title').t`Refine your Categories`}
                    description={c('Description')
                        .t`Right-click an email and select “Move to”, or drag and drop it into another category. Similar emails will be sorted there automatically in the future.`}
                    step={step - 1}
                    onSkip={handleSkip}
                    onNext={() => {
                        completeCurrentStep();
                    }}
                />
            );
        }

        if (step === OnboardingStep.CUSTOMIZE) {
            const step = B2C_ONBOARDING_SEQUENCE.findIndex(({ step }) => step === OnboardingStep.CUSTOMIZE);
            return (
                <SpotlightContent
                    title={c('Title').t`You're in control`}
                    description={c('Description')
                        .t`Add or remove categories, manage notifications, or turn them off entirely - anytime in Settings.`}
                    step={step - 1}
                    onSkip={handleSkip}
                    onNext={() => {
                        completeCurrentStep();
                    }}
                />
            );
        }

        if (step === OnboardingStep.FREE_USERS_SPOTLIGHT) {
            const href = getAppHref('mail/general#categories', APPS.PROTONACCOUNT, authentication.localID);

            return (
                <div>
                    <h2 className="mb-1 text-rg text-semibold">{c('Title').t`Make your inbox your own`}</h2>
                    <p className="m-0 mb-4 text-rg color-weak">{c('Description')
                        .t`Add or remove categories, manage notifications, and adjust your setup anytime in settings.`}</p>
                    <div className="flex w-full gap-2">
                        <ButtonLike
                            as={Href}
                            href={href}
                            target="_blank"
                            onClick={completeCurrentStep}
                            className="flex-1"
                            size="small"
                            color="norm"
                        >{c('Actions').t`Set up categories`}</ButtonLike>
                        {/* We use completeCurrentStep here to only override the SPOTLIGHT_FREE_USERS bit */}
                        <Button
                            onClick={completeCurrentStep}
                            className="flex-1"
                            size="small"
                            shape="outline"
                            color="weak"
                        >
                            {c('Actions').t`Not now`}
                        </Button>
                    </div>
                </div>
            );
        }
    };

    const shouldWrap = needsWrapper(children);

    const isActive = activeStep === step;
    const isFreeUserSpotlight = step === OnboardingStep.FREE_USERS_SPOTLIGHT;
    // We want to delay the display of the free-user spotlight to make it less intrusive
    const delayedFreeUserShow = useSpotlightShow(isActive && isFreeUserSpotlight, 3 * SECOND);
    const show = isFreeUserSpotlight ? delayedFreeUserShow : isActive;

    return (
        <Spotlight
            show={show}
            size={isFreeUserSpotlight ? 'large' : undefined}
            borderRadius="xl"
            hasClose={false}
            innerClassName="p-6"
            content={getContent()}
        >
            {shouldWrap ? <div>{children}</div> : children}
        </Spotlight>
    );
};
