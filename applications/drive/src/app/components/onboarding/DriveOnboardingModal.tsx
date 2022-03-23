import { c } from 'ttag';
import { getAppName } from '@proton/shared/lib/apps/helper';
import { OnboardingContent, OnboardingModal, OnboardingStep, OnboardingStepRenderCallback } from '@proton/components';
import { APPS } from '@proton/shared/lib/constants';

import onboardingWelcome from '@proton/styles/assets/img/onboarding/drive-welcome.svg';

const DriveOnboardingModal = (props: any) => {
    const appName = getAppName(APPS.PROTONDRIVE);

    return (
        <OnboardingModal {...props}>
            {({ onNext }: OnboardingStepRenderCallback) => (
                <OnboardingStep
                    submit={c('Onboarding Action').t`Start using ${appName}`}
                    onSubmit={onNext}
                    close={null}
                >
                    <OnboardingContent
                        title={c('Onboarding Title').t`Meet your new secure file storage`}
                        description={c('Onboarding Info')
                            .t`Protect all your files with end-to-end encryption. Use ${appName} to store and share your files securely.`}
                        img={<img src={onboardingWelcome} alt={appName} />}
                    />
                </OnboardingStep>
            )}
        </OnboardingModal>
    );
};

export default DriveOnboardingModal;
