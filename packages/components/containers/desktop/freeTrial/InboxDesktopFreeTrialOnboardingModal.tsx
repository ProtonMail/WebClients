import { useEffect } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { ModalTwo, ModalTwoContent, ModalTwoFooter, useModalState } from '@proton/components/components';
import { useUser } from '@proton/components/hooks';
import { BRAND_NAME, MAIL_APP_NAME } from '@proton/shared/lib/constants';
import protonDesktop from '@proton/styles/assets/img/illustrations/proton-desktop.svg';

import { freeTrialUpgradeClick } from './freeTrialUpgradeClick';
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

    return (
        <>
            {render && (
                <ModalTwo size="small" {...modalState} onClose={startFreeTrial}>
                    <ModalTwoContent className="text-center mt-8 mb-4 flex gap-6 flex-column">
                        <img src={protonDesktop} alt={c('Free trial desktop').t`${MAIL_APP_NAME} desktop app`} />
                        <div>
                            <h1 className="text-bold mb-2 text-2xl">{c('Free trial desktop')
                                .t`Introducing the desktop app`}</h1>
                            <p className="my-0">{c('Free trial desktop')
                                .jt`Enjoy fast, secure, and distraction-free access to your inbox and calendar.`}</p>
                        </div>
                        <div>
                            <Button color="norm" size="large" onClick={handleClose} fullWidth>{c('Free trial destkop')
                                .t`Try free for 14 days`}</Button>
                            <p className="m-0 color-weak mt-2 text-sm">{c('Free trial desktop')
                                .t`No credit card required`}</p>
                        </div>
                    </ModalTwoContent>
                    <ModalTwoFooter className="flex text-sm text-center mb-8 flex-column mt-0">
                        <hr className="mb-4" />
                        <p className="m-0 color-weak">{c('Free trial desktop')
                            .t`Get unimited acces with paid ${BRAND_NAME} plan`}</p>
                        <Button color="norm" shape="underline" className="m-0 p-0" onClick={freeTrialUpgradeClick}>{c(
                            'Free trial desktop'
                        ).t`Upgrade now`}</Button>
                    </ModalTwoFooter>
                </ModalTwo>
            )}
        </>
    );
};

export default InboxDesktopFreeTrialOnboardingModal;
