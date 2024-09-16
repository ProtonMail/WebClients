import { useEffect } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { ModalTwo, ModalTwoContent, ModalTwoFooter, useModalState } from '@proton/components/components';
import { useUser } from '@proton/components/hooks';
import { APP_UPSELL_REF_PATH, MAIL_APP_NAME, MAIL_UPSELL_PATHS, UPSELL_COMPONENT } from '@proton/shared/lib/constants';
import { getUpsellRef } from '@proton/shared/lib/helpers/upsell';
import protonDesktop from '@proton/styles/assets/img/illustrations/proton-desktop.svg';

import { freeTrialUpgradeClick } from '../openExternalLink';
import useInboxFreeTrial from './useInboxFreeTrial';

const InboxDesktopFreeTrialOnboardingModal = () => {
    const { firstLogin, startFreeTrial } = useInboxFreeTrial();
    const [user] = useUser();
    const [modalState, setModalState, render] = useModalState();

    const upsellRef = getUpsellRef({
        app: APP_UPSELL_REF_PATH.INBOX_DESKTOP_REF_PATH,
        component: UPSELL_COMPONENT.MODAL,
        feature: MAIL_UPSELL_PATHS.TRIAL_WELCOME,
    });

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
                                .t`Try the app-new desktop app`}</h1>
                            <p className="my-0">{c('Free trial desktop')
                                .t`Enjoy fast, secure, and distraction-free access to your inbox and calendar.`}</p>
                        </div>
                        <div>
                            <Button color="norm" size="large" onClick={handleClose} fullWidth>{c('Free trial desktop')
                                .t`Start free trial`}</Button>
                            <div className="text-center flex flex-column color-weak text-sm gap-0.5 mt-4">
                                <p className="m-0">{c('Free trial desktop').t`14-day desktop app trial.`}</p>
                                <p className="m-0">{c('Free trial desktop').t`No credit card required.`}</p>
                            </div>
                        </div>
                    </ModalTwoContent>
                    <ModalTwoFooter className="flex text-sm text-center mb-8 flex-column mt-0">
                        <hr className="mb-4" />
                        <p className="m-0 color-weak">{c('Free trial desktop')
                            .t`Get unlimited access with any ${MAIL_APP_NAME} plan.`}</p>
                        <Button
                            color="norm"
                            shape="underline"
                            className="m-0 p-0 text-semibold"
                            onClick={() => freeTrialUpgradeClick(upsellRef)}
                        >{c('Free trial desktop').t`Upgrade now`}</Button>
                    </ModalTwoFooter>
                </ModalTwo>
            )}
        </>
    );
};

export default InboxDesktopFreeTrialOnboardingModal;
