import { c } from 'ttag';

import { OnboardingContent, EarlyAccessModal, ModalTwo, ModalProps, Button, useModalState } from '@proton/components';
import { APPS } from '@proton/shared/lib/constants';
import { getAppName } from '@proton/shared/lib/apps/helper';
import onboardingWelcome from '@proton/styles/assets/img/onboarding/drive-upgrade.svg';

const DriveOnboardingModalNoBeta = (props: ModalProps) => {
    const appName = getAppName(APPS.PROTONDRIVE);
    const [modalProps, setModal, renderModal] = useModalState();

    return (
        <>
            {renderModal && <EarlyAccessModal {...modalProps} />}
            <ModalTwo size="small" {...props}>
                <div className="p2">
                    <OnboardingContent
                        title={c('Onboarding Title').t`${appName} is in Beta`}
                        description={c('Onboarding Info')
                            .t`${appName} is currently only available if you enable Beta Access.`}
                        img={<img src={onboardingWelcome} alt={appName} />}
                    />
                    <Button size="large" color="norm" fullWidth onClick={() => setModal(true)}>
                        {c('Onboarding Action').t`Enable Beta Access`}
                    </Button>
                </div>
            </ModalTwo>
        </>
    );
};

export default DriveOnboardingModalNoBeta;
