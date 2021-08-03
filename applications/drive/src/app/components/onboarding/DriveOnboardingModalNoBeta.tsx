import { c } from 'ttag';

import { OnboardingContent, OnboardingModal, OnboardingStep, EarlyAccessModal, useModals } from '@proton/components';
import { APPS } from '@proton/shared/lib/constants';
import { getAppName } from '@proton/shared/lib/apps/helper';
import onboardingWelcome from '@proton/styles/assets/img/onboarding/drive-upgrade.svg';

const DriveOnboardingModalNoBeta = (props: any) => {
    const appName = getAppName(APPS.PROTONDRIVE);
    const { createModal } = useModals();

    return (
        <OnboardingModal setWelcomeFlags={false} showGenericSteps={false} hideDisplayName {...props}>
            {() => (
                <OnboardingStep
                    close={null}
                    submit={c('Onboarding Proton Drive Action').t`Enable Beta Access`}
                    onSubmit={() => {
                        createModal(<EarlyAccessModal />);
                    }}
                >
                    <OnboardingContent
                        title={c('Onboarding Proton Drive Title').t`${appName} is in Beta`}
                        description={c('Onboarding Proton Drive Info')
                            .t`${appName} is currently only available if you enable Beta Access.`}
                        img={<img src={onboardingWelcome} alt={appName} />}
                    />
                </OnboardingStep>
            )}
        </OnboardingModal>
    );
};

export default DriveOnboardingModalNoBeta;
