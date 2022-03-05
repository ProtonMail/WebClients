import { c } from 'ttag';
import { Button, ModalProps, ModalTwo, OnboardingContent, useSettingsLink } from '@proton/components';
import { APPS } from '@proton/shared/lib/constants';
import { getAppName } from '@proton/shared/lib/apps/helper';

import onboardingWelcome from '@proton/styles/assets/img/onboarding/drive-upgrade.svg';

const DriveOnboardingModalNoAccess = (props: ModalProps) => {
    const goToSettings = useSettingsLink();
    const appName = getAppName(APPS.PROTONDRIVE);

    return (
        <ModalTwo size="small" {...props}>
            <div className="p2">
                <OnboardingContent
                    title={c('Onboarding Title').t`Upgrade to access ${appName}`}
                    description={c('Onboarding Info')
                        .t`${appName} is currently in early access and only available to users with a paid plan.`}
                    img={<img src={onboardingWelcome} alt={appName} />}
                />
                <Button
                    size="large"
                    color="norm"
                    fullWidth
                    onClick={() => {
                        goToSettings('/dashboard');
                    }}
                >
                    {c('Onboarding Action').t`Upgrade account`}
                </Button>
            </div>
        </ModalTwo>
    );
};

export default DriveOnboardingModalNoAccess;
