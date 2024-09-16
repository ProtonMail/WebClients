import { useEffect } from 'react';
import { useHistory } from 'react-router-dom';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { useTheme } from '@proton/components';
import { freeTrialUpgradeClick, openLinkInBrowser } from '@proton/components/containers/desktop/openExternalLink';
import { getAppHref } from '@proton/shared/lib/apps/helper';
import {
    APPS,
    APP_UPSELL_REF_PATH,
    MAIL_APP_NAME,
    MAIL_UPSELL_PATHS,
    UPSELL_COMPONENT,
} from '@proton/shared/lib/constants';
import { resetEndOfTrialIPCCall } from '@proton/shared/lib/desktop/endOfTrialHelpers';
import { hasInboxDesktopFeature } from '@proton/shared/lib/desktop/ipcHelpers';
import { isElectronMail } from '@proton/shared/lib/helpers/desktop';
import { getUpsellRef } from '@proton/shared/lib/helpers/upsell';
import protonDesktopTrialEnd from '@proton/styles/assets/img/illustrations/proton-desktop-trial-end.svg';
import inboxPlaceholder from '@proton/styles/assets/img/inbox-desktop/inbox_placeholder.png';
import inboxPlaceholderDark from '@proton/styles/assets/img/inbox-desktop/inbox_placeholder_dark.png';

import Layout from './Layout';
import Main from './Main';

import './InboxDesktopFreeTrialEnded.scss';

const WebAppLink = () => {
    const handleClick = () => {
        openLinkInBrowser(getAppHref('/', APPS.PROTONMAIL));
    };

    // translator: The whole sentence is "Open Proton Mail in the web app", width is limited since it's displayed in the login screen
    return <Button shape="underline" color="norm" onClick={handleClick}>{c('Free trial dekstop').t`web app`}</Button>;
};

const InboxDesktopFreeTrialEnded = () => {
    const history = useHistory();
    const theme = useTheme();

    const upsellRef = getUpsellRef({
        app: APP_UPSELL_REF_PATH.INBOX_DESKTOP_REF_PATH,
        component: UPSELL_COMPONENT.MODAL,
        feature: MAIL_UPSELL_PATHS.TRIAL_END,
    });

    useEffect(() => {
        // The free trial page is only displayed for the electron desktop application
        // This is put here as security to prevent users on the web to access this page
        if (!isElectronMail) {
            history.replace('/login');
        }
    }, []);

    const backToLogin = () => {
        resetEndOfTrialIPCCall();

        if (hasInboxDesktopFeature('MultiAccount')) {
            history.replace('/switch');
        } else {
            history.replace('/login');
        }
    };

    const webAppMessage = <WebAppLink key="web-app" />;
    return (
        <Layout layoutClassName="free-trial-blur" hasDecoration={false} toApp={APPS.PROTONMAIL}>
            <img
                src={theme.information.dark ? inboxPlaceholderDark : inboxPlaceholder}
                alt=""
                className="blur-background h-custom w-custom absolute top-0 left-0 z-0 opacity-70"
                style={{ '--h-custom': '100vh', '--w-custom': '100vw' }}
            />
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
                        <Button
                            color="norm"
                            className="mb-2"
                            onClick={() => freeTrialUpgradeClick(upsellRef)}
                            fullWidth
                        >{c('Free trial desktop').t`Keep using the desktop app`}</Button>
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
