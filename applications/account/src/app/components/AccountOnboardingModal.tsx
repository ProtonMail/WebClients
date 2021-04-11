import React from 'react';
import { c } from 'ttag';
import { getAppName } from 'proton-shared/lib/apps/helper';
import { OnboardingContent, OnboardingModal, OnboardingStep, OnboardingStepRenderCallback } from 'react-components';
import { APPS } from 'proton-shared/lib/constants';

import onboardingWelcome from 'design-system/assets/img/onboarding/onboarding-protonmail-subdomain.svg';

const AccountOnboardingModal = (props: any) => {
    const appName = getAppName(APPS.PROTONACCOUNT);

    return (
        <OnboardingModal {...props}>
            {({ onClose }: OnboardingStepRenderCallback) => (
                <OnboardingStep
                    title={c('Onboarding ProtonAccount').t`Welcome to ${appName}`}
                    submit={c('Onboarding ProtonAccount').t`Start using ${appName}`}
                    onSubmit={onClose}
                    close={null}
                >
                    <OnboardingContent
                        description={
                            <>
                                <div className="mb1">
                                    {c('Onboarding ProtonAccount')
                                        .t`When you sign in to your Proton account, we'll remember your credentials even if you close a browser tab, and you can keep multiple Proton apps open in different tabs at once.`}
                                </div>
                                <div>
                                    {c('Onboarding ProtonAccount')
                                        .t`You can switch between Proton apps using the menu in the top left corner.`}
                                </div>
                            </>
                        }
                        img={<img src={onboardingWelcome} alt={appName} />}
                    />
                </OnboardingStep>
            )}
        </OnboardingModal>
    );
};

export default AccountOnboardingModal;
