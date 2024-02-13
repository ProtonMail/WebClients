import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { MAIL_APP_NAME } from '@proton/shared/lib/constants';
import { canInvokeInboxDesktopIPC } from '@proton/shared/lib/desktop/ipcHelpers';
import protonDesktopTrialEnd from '@proton/styles/assets/img/illustrations/proton-desktop-trial-end.svg';

import useInboxFreeTrialEnded from './useInboxFreeTrialEnded';

interface Props {
    backToLoginClick: () => void;
}

const WebAppLink = () => {
    // TODO add openExtenral event
    const handleClick = () => {
        if (canInvokeInboxDesktopIPC) {
            // window.ipcInboxMessageBroker?.send()
        }
    };

    return <Button shape="underline" color="norm" onClick={handleClick}>{c('Free trial dekstop').t`web app`}</Button>;
};

const InboxDesktopFreeTrialEnded = ({ backToLoginClick }: Props) => {
    const { hasTrialEnded } = useInboxFreeTrialEnded();
    if (!hasTrialEnded) {
        return null;
    }

    const webAppMessage = <WebAppLink key="web-app" />;
    return (
        <div className="flex justify-center text-center items-center item-start flex-column gap-6">
            <img src={protonDesktopTrialEnd} alt={c('Free trial desktop').t`ProtonMail desktop app`} />

            <div>
                <h1 className="text-bold mb-2 text-2xl">{c('Free trial desktop').t`Desktop app trial has ended`}</h1>
                <p className="m-0">{c('Free trial desktop')
                    .t`Continue to enjoy fast, secure, and distraction-free access to your inbox and calendar. Upgrade to keep using the desktop app.`}</p>
            </div>
            <div>
                <Button color="norm" className="mb-4" fullWidth>{c('Free trial desktop')
                    .t`Keep using the desktop app`}</Button>
                <Button onClick={backToLoginClick} shape="outline" fullWidth>{c('Free trial desktop')
                    .t`Back to sign in`}</Button>
            </div>
            <div>
                <p className="m-0">{c('Free trial desktop').jt`Open ${MAIL_APP_NAME} in the ${webAppMessage}`}</p>
            </div>
        </div>
    );
};

export default InboxDesktopFreeTrialEnded;
