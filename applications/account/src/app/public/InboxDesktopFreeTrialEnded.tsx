import { useHistory } from 'react-router-dom';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { freeTrialUpgradeClick } from '@proton/components/containers/desktop/freeTrial/freeTrialUpgradeClick';
import { getAppHref } from '@proton/shared/lib/apps/helper';
import { APPS, MAIL_APP_NAME } from '@proton/shared/lib/constants';
import { resetEndOfTrialIPCCall } from '@proton/shared/lib/desktop/endOfTrialHelpers';
import { canInvokeInboxDesktopIPC } from '@proton/shared/lib/desktop/ipcHelpers';
import { isElectronApp } from '@proton/shared/lib/helpers/desktop';
import protonDesktopTrialEnd from '@proton/styles/assets/img/illustrations/proton-desktop-trial-end.svg';

import Layout from './Layout';
import Main from './Main';

const WebAppLink = () => {
    const handleClick = () => {
        if (canInvokeInboxDesktopIPC) {
            window.ipcInboxMessageBroker!.send('openExternal', getAppHref('/', APPS.PROTONMAIL));
        }
    };

    // translator: The whole sentence is "Open Proton Mail in the web app", width is limited since it's displayed in the login screen
    return <Button shape="underline" color="norm" onClick={handleClick}>{c('Free trial dekstop').t`web app`}</Button>;
};

const InboxDesktopFreeTrialEnded = () => {
    const history = useHistory();
    if (!isElectronApp) {
        history.replace('/login');
    }

    const backToLogin = () => {
        resetEndOfTrialIPCCall();
        history.replace('/login');
    };

    const webAppMessage = <WebAppLink key="web-app" />;
    return (
        <Layout>
            <Main>
                <div className="self-center my-auto flex justify-center text-center items-center item-start flex-column gap-6">
                    <img src={protonDesktopTrialEnd} alt={c('Free trial desktop').t`${MAIL_APP_NAME} desktop app`} />

                    <div>
                        <h1 className="text-bold mb-2 text-2xl">{c('Free trial desktop')
                            .t`Your desktop app free trial has ended`}</h1>
                        <p className="m-0">{c('Free trial desktop')
                            .t`Continue to enjoy a fast, focused, and secure desktop experience. Upgrade to unlock unlimited access and other premium features. `}</p>
                    </div>
                    <div>
                        <Button color="norm" className="mb-2" onClick={freeTrialUpgradeClick} fullWidth>{c(
                            'Free trial desktop'
                        ).t`Keep using the desktop app`}</Button>
                        <Button onClick={backToLogin} shape="outline" fullWidth>{c('Free trial desktop')
                            .t`Back to sign in`}</Button>
                    </div>
                    <div>
                        <p className="m-0">{c('Free trial desktop')
                            .jt`Open ${MAIL_APP_NAME} in the ${webAppMessage}`}</p>
                    </div>
                </div>
            </Main>
        </Layout>
    );
};

export default InboxDesktopFreeTrialEnded;
