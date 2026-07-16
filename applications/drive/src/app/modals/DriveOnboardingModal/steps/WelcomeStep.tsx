import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { IcGlobe } from '@proton/icons/icons/IcGlobe';
import { IcImage } from '@proton/icons/icons/IcImage';
import { IcPencil } from '@proton/icons/icons/IcPencil';
import { IcUsers } from '@proton/icons/icons/IcUsers';
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
                        icon: <IcGlobe />,
                        text: c('Onboarding Info').t`Sync and access your files from anywhere`,
                    },
                    {
                        icon: <IcImage />,
                        text: c('Onboarding Info').t`Back up your photos and memories`,
                    },
                    {
                        icon: <IcPencil />,
                        text: c('Onboarding Info').t`Edit documents online`,
                    },
                    {
                        icon: <IcUsers />,
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
