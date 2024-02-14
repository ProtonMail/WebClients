import { Link } from 'react-router-dom';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { getAppHref } from '@proton/shared/lib/apps/helper';
import { APPS, MAIL_APP_NAME } from '@proton/shared/lib/constants';
import { canInvokeInboxDesktopIPC } from '@proton/shared/lib/desktop/ipcHelpers';
import protonDesktopTrialEnd from '@proton/styles/assets/img/illustrations/proton-desktop-trial-end.svg';

import useInboxFreeTrialEnded from './useInboxFreeTrialEnded';

const WebAppLink = () => {
    const handleClick = () => {
        if (canInvokeInboxDesktopIPC) {
            window.ipcInboxMessageBroker?.send('openExternal', getAppHref('/', APPS.PROTONMAIL));
        }
    };

    return <Button shape="underline" color="norm" onClick={handleClick}>{c('Free trial dekstop').t`web app`}</Button>;
};

const InboxDesktopFreeTrialEnded = () => {
    const { hasTrialEnded } = useInboxFreeTrialEnded();
    if (!hasTrialEnded) {
        return null;
    }

    // TODO add upsell ref
    const upgradeButtonClick = () => {
        if (canInvokeInboxDesktopIPC) {
            window.ipcInboxMessageBroker?.send('openExternal', getAppHref('/mail/upgrade', APPS.PROTONMAIL));
        }
    };

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
                <Button color="norm" className="mb-4" onClick={upgradeButtonClick} fullWidth>{c('Free trial desktop')
                    .t`Keep using the desktop app`}</Button>
                <Link to="/login">{c('Free trial desktop').t`Back to sign in`}</Link>
            </div>
            <div>
                <p className="m-0">{c('Free trial desktop').jt`Open ${MAIL_APP_NAME} in the ${webAppMessage}`}</p>
            </div>
        </div>
    );
};

export default InboxDesktopFreeTrialEnded;
