import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { OnboardingContent, OnboardingStep } from '@proton/components/containers/onboarding';
import { getWelcomeToText } from '@proton/shared/lib/apps/text';
import { DRIVE_APP_NAME } from '@proton/shared/lib/constants';
import onboardingWelcome from '@proton/styles/assets/img/onboarding/drive-welcome.svg';

import type { StepProps } from './interface';

type Props = {
    isB2B: boolean;
    hasNextStep: boolean;
};

export const WelcomeStep = ({ isB2B, hasNextStep, onNext }: StepProps<Props>) => {
    return (
        <OnboardingStep>
            <OnboardingContent
                title={getWelcomeToText(DRIVE_APP_NAME)}
                description={
                    isB2B
                        ? c('Onboarding Info')
                              .t`Securely store, manage, and share your business-critical files with confidence.`
                        : c('Onboarding Info').t`Your trusty online vault for vital documents and precious memories.`
                }
                img={<img src={onboardingWelcome} alt={DRIVE_APP_NAME} />}
            />
            <footer>
                <Button size="large" color="norm" fullWidth onClick={onNext}>
                    {hasNextStep
                        ? c('Onboarding Action').t`Next`
                        : c('Onboarding Action').t`Start using ${DRIVE_APP_NAME}`}
                </Button>
            </footer>
        </OnboardingStep>
    );
};
