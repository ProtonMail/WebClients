import { useEffect } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { ModalTwo, ModalTwoContent, ModalTwoFooter, useModalState } from '@proton/components/components';
import { useUser } from '@proton/components/hooks';
import { getAppHref } from '@proton/shared/lib/apps/helper';
import { APPS, BRAND_NAME, MAIL_APP_NAME } from '@proton/shared/lib/constants';
import { canInvokeInboxDesktopIPC } from '@proton/shared/lib/desktop/ipcHelpers';
import protonDesktop from '@proton/styles/assets/img/illustrations/proton-desktop.svg';

import useInboxFreeTrial from './useInboxFreeTrial';

const InboxDesktopFreeTrialOnboardingModal = () => {
    const { firstLogin, startFreeTrial } = useInboxFreeTrial();
    const [user] = useUser();
    const [modalState, setModalState, render] = useModalState();

    useEffect(() => {
        if (firstLogin) {
            setModalState(true);
        }
    }, [firstLogin]);

    if (user.hasPaidMail) {
        return null;
    }

    const handleClose = () => {
        setModalState(false);
        startFreeTrial();
    };

    const handleUpgradeClick = () => {
        if (canInvokeInboxDesktopIPC) {
            window.ipcInboxMessageBroker?.send('openExternal', getAppHref('/', APPS.PROTONACCOUNT));
        }
    };

    // TODO - Open the upgrade button in the desktop app once MR is merged
    return (
        <>
            {render && (
                <ModalTwo size="small" {...modalState} onClose={startFreeTrial}>
                    <ModalTwoContent className="text-center mt-8 mb-4 flex gap-6 flex-column">
                        <img src={protonDesktop} alt={c('Free trial desktop').t`ProtonMail desktop app`} />
                        <div>
                            <h1 className="text-bold mb-2 text-2xl">{c('Free trial desktop').t`Welcome`}</h1>
                            <p className="my-0">{c('Free trial desktop')
                                .jt`The ${MAIL_APP_NAME} desktop app is a fast and secure experience for your emails and calendar, free from distractions.`}</p>
                        </div>
                        <div>
                            <Button color="norm" size="large" onClick={handleClose} fullWidth>{c('Free trial destkop')
                                .t`Try free for 14 days`}</Button>
                            <p className="m-0 color-weak mt-2 text-sm">{c('Free trial desktop')
                                .t`No credit card required`}</p>
                        </div>
                    </ModalTwoContent>
                    <ModalTwoFooter className="flex text-center mb-8 flex-column mt-0">
                        <hr className="mb-4" />
                        <p className="m-0 color-weak">{c('Free trial desktop')
                            .t`Get unimited acces with paid ${BRAND_NAME} plan`}</p>
                        <Button color="norm" shape="underline" className="m-0" onClick={handleUpgradeClick}>{c(
                            'Free trial desktop'
                        ).t`Upgrade now`}</Button>
                    </ModalTwoFooter>
                </ModalTwo>
            )}
        </>
    );
};

export default InboxDesktopFreeTrialOnboardingModal;
