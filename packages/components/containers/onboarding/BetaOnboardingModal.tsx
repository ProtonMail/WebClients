import React from 'react';
import { c } from 'ttag';
import earlyAccessSvg from '@proton/styles/assets/img/onboarding/early-access.svg';
import { noop } from '@proton/shared/lib/helpers/function';

import useEarlyAccess from '../../hooks/useEarlyAccess';
import useLoading from '../../hooks/useLoading';

import OnboardingContent from './OnboardingContent';
import OnboardingStep from './OnboardingStep';
import OnboardingModal from './OnboardingModal';

const BetaOnboardingModal = (props: any) => {
    const earlyAccess = useEarlyAccess();
    const [loading, withLoading] = useLoading();

    const handleSubmit = () => {
        withLoading(
            earlyAccess
                .update(true)
                .then(() => {
                    window.location.reload();
                })
                .catch(noop)
        );
    };

    return (
        <OnboardingModal setWelcomeFlags={false} showGenericSteps={false} hideDisplayName {...props}>
            {() => (
                <OnboardingStep
                    close={null}
                    submit={c('Onboarding Beta').t`Got it`}
                    onSubmit={handleSubmit}
                    loading={loading || !earlyAccess.canUpdate}
                >
                    <OnboardingContent
                        title={c('Onboarding Beta').t`Beta enabled`}
                        description={c('Onboarding Beta')
                            .t`To disable beta, open the settings dropdown menu and click on the “Beta Access” option.`}
                        img={<img src={earlyAccessSvg} alt={c('Onboarding Beta').t`Beta enabled`} />}
                    />
                </OnboardingStep>
            )}
        </OnboardingModal>
    );
};

export default BetaOnboardingModal;
