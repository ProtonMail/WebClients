import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { getWelcomeToText } from '@proton/shared/lib/apps/text';
import { DRIVE_APP_NAME } from '@proton/shared/lib/constants';
import onboardingWelcome from '@proton/styles/assets/img/onboarding/drive-v2-welcome.svg';

import { Container } from '../Container';
import { IconList } from '../IconList';
import type { OnboardingProps } from '../interface';

export const WelcomeStep = () => {
    return (
        <Container
            title={c('Onboarding Info').t`End-to-end encrypted storage for your files`}
            subtitle={getWelcomeToText(DRIVE_APP_NAME)}
            image={onboardingWelcome}
        >
            <IconList
                items={[
                    {
                        icon: 'globe',
                        text: c('Onboarding Info').t`Sync and access your files from anywhere`,
                    },
                    {
                        icon: 'image',
                        text: c('Onboarding Info').t`Back up your photos and memories`,
                    },
                    {
                        icon: 'pencil',
                        text: c('Onboarding Info').t`Edit documents online`,
                    },
                    {
                        icon: 'users',
                        text: c('Onboarding Info').t`Securely share files and folders`,
                    },
                ]}
            />
        </Container>
    );
};

export const WelcomeStepButtons = ({ onNext }: OnboardingProps) => {
    return (
        <div className="w-full flex justify-end">
            <Button size="large" color="norm" onClick={onNext}>
                {c('Onboarding Action').t`Get started`}
            </Button>
        </div>
    );
};
