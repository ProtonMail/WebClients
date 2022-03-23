import { c } from 'ttag';
import { OnboardingContent, OnboardingModal, OnboardingStep, useSettingsLink } from '@proton/components';
import { APPS } from '@proton/shared/lib/constants';
import { getAppName } from '@proton/shared/lib/apps/helper';

import onboardingWelcome from '@proton/styles/assets/img/onboarding/drive-upgrade.svg';

const DriveOnboardingModalNoAccess = (props: any) => {
    const goToSettings = useSettingsLink();
    const appName = getAppName(APPS.PROTONDRIVE);

    const handleBack = () => goToSettings('/dashboard');

    return (
        <OnboardingModal setWelcomeFlags={false} showGenericSteps={false} hideDisplayName {...props}>
            {() => (
                <OnboardingStep close={null} submit={c('Onboarding Action').t`Upgrade account`} onSubmit={handleBack}>
                    <OnboardingContent
                        title={c('Onboarding Title').t`Upgrade to access ${appName}`}
                        description={c('Onboarding Info')
                            .t`${appName} is currently in early access and only available to users with a paid plan.`}
                        img={<img src={onboardingWelcome} alt={appName} />}
                    />
                </OnboardingStep>
            )}
        </OnboardingModal>
    );
};

export default DriveOnboardingModalNoAccess;
