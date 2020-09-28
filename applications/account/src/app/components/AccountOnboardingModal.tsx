import React from 'react';
import { c } from 'ttag';
import { getAppName } from 'proton-shared/lib/apps/helper';
import {
    OnboardingContent,
    OnboardingModal,
    OnboardingStep,
    OnboardingStepRenderCallback,
    useAppLink,
} from 'react-components';
import { APPS } from 'proton-shared/lib/constants';

import onboardingWelcome from 'design-system/assets/img/onboarding/onboarding-protonmail.svg';
import onboardingWelcomeDark from 'design-system/assets/img/onboarding/onboarding-protonmail-dark.svg';
import { getLightOrDark } from 'proton-shared/lib/themes/helpers';

const AccountOnboardingModal = (props: any) => {
    const goToApp = useAppLink();

    const appName = getAppName(APPS.PROTONACCOUNT);
    const mailAppName = getAppName(APPS.PROTONMAIL);

    const handleSubmit = () => {
        goToApp('/', APPS.PROTONMAIL);
    };

    return (
        <OnboardingModal {...props}>
            {({ onClose }: OnboardingStepRenderCallback) => (
                <OnboardingStep
                    title={c('Onboarding ProtonAccount').t`Welcome to ${appName}`}
                    submit={c('Onboarding ProtonAccount').t`Start using ${mailAppName}`}
                    onSubmit={handleSubmit}
                    close={c('Onboarding ProtonAccount').t`Got it`}
                    onClose={onClose}
                >
                    <OnboardingContent
                        description={c('Onboarding ProtonAccount')
                            .t`When you sign in to your Proton account, we'll remember your credentials even if you close a browser tab, and you can keep multiple Proton apps open in different tabs at once.`}
                        img={<img src={getLightOrDark(onboardingWelcome, onboardingWelcomeDark)} alt={appName} />}
                        text={c('Onboarding ProtonAccount')
                            .t`You can switch between Proton apps using the menu in the top left corner.`}
                    />
                </OnboardingStep>
            )}
        </OnboardingModal>
    );
};

export default AccountOnboardingModal;
