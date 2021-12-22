import * as React from 'react';
import {
    SettingsLink,
    ButtonLike,
    FeatureCode,
    Href,
    Loader,
    useImporters,
    useCalendars,
    useFeature,
    usePlans,
    useTheme,
    useUser,
    useUserSettings,
} from '@proton/components';
import { c, msgid } from 'ttag';
import { Location } from 'history';
import { MailSettings } from '@proton/shared/lib/interfaces';
import { APPS, MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { capitalize } from '@proton/shared/lib/helpers/string';
import { LabelCount } from '@proton/shared/lib/interfaces/Label';
import envelope from '@proton/styles/assets/img/placeholders/welcome-pane.svg';
import mobileMailApp from '@proton/styles/assets/img/placeholders/app-teaser.svg';
import appStore from '@proton/styles/assets/img/shared/app-store.svg';
import playStore from '@proton/styles/assets/img/shared/play-store.svg';

import { isConversationMode } from '../../helpers/mailSettings';
import WelcomePaneBanner from './WelcomePaneBanner';

interface ContainerProps {
    children: React.ReactNode;
}

const Container = ({ children }: ContainerProps) => (
    <div className="flex h100 scroll-if-needed pt1 pb1 pr2 pl2">
        <div className="mauto text-center max-w30e">{children}</div>
    </div>
);
interface Props {
    mailSettings: MailSettings | undefined;
    location: Location;
    labelCount: LabelCount | undefined;
}

const WelcomePane = ({ mailSettings, location, labelCount }: Props) => {
    const conversationMode = isConversationMode(MAILBOX_LABEL_IDS.INBOX, mailSettings, location);
    const { feature: featureUsedMailMobileApp, loading: loadingUsedMailMobileApp } = useFeature(
        FeatureCode.UsedMailMobileApp
    );

    const [user, loadingUser] = useUser();
    const [plans = [], loadingPlans] = usePlans();
    const [theme] = useTheme();
    const [userSettings, loadingUserSettings] = useUserSettings();
    const [calendars, loadingCalendars] = useCalendars();
    const [imports = [], importsLoading] = useImporters();
    const hasAlreadyImported = imports.length;
    const loading =
        importsLoading ||
        loadingUsedMailMobileApp ||
        loadingUser ||
        loadingPlans ||
        loadingUserSettings ||
        loadingCalendars;

    const unread = labelCount?.Unread || 0;
    const total = labelCount?.Total || 0;
    const imageSvg = featureUsedMailMobileApp?.Value ? envelope : mobileMailApp;
    const userName = (
        <span key="display-name" className="inline-block max-w100 text-ellipsis align-bottom">
            {capitalize(user.DisplayName)}
        </span>
    );

    const unreadsLabel = conversationMode ? (
        <strong key="unreads-label">
            {c('Info').ngettext(msgid`${unread} unread conversation`, `${unread} unread conversations`, unread)}
        </strong>
    ) : (
        <strong key="unreads-label">
            {c('Info').ngettext(msgid`${unread} unread message`, `${unread} unread messages`, unread)}
        </strong>
    );

    const totalLabel = conversationMode ? (
        <strong key="total-label">
            {c('Info').ngettext(msgid`${total} conversation`, `${total} conversations`, total)}
        </strong>
    ) : (
        <strong key="total-label">{c('Info').ngettext(msgid`${total} message`, `${total} messages`, total)}</strong>
    );

    const counterMessage = unread
        ? c('Info').jt`You have ${unreadsLabel} in your inbox.`
        : c('Info').jt`You have ${totalLabel} in your inbox.`;

    if (loading) {
        return (
            <Container>
                <Loader />
            </Container>
        );
    }

    return (
        <>
            {user.isFree ? (
                <WelcomePaneBanner
                    plans={plans}
                    userSettings={userSettings}
                    theme={theme}
                    calendars={calendars || undefined}
                />
            ) : null}
            <Container>
                <h1>{user.DisplayName ? c('Title').jt`Welcome ${userName}` : c('Title').t`Welcome`}</h1>
                <p className="text-keep-space">{labelCount ? counterMessage : null}</p>
                <hr className="mb2 mt2" />
                <div className="text-rg">
                    <img className="hauto" src={imageSvg} alt={c('Alternative text for welcome image').t`Welcome`} />
                </div>
                {featureUsedMailMobileApp?.Value ? null : (
                    <>
                        <p>{c('Info')
                            .t`Download our mobile application from your favorite app store to communicate securely on-the-go.`}</p>
                        <div className="text-rg">
                            <Href
                                className="inline-block mr1"
                                url="https://itunes.apple.com/app/protonmail-encrypted-email/id979659905"
                            >
                                <img className="hauto" src={appStore} alt="App Store" />
                            </Href>
                            <Href
                                className="inline-block"
                                url="https://play.google.com/store/apps/details?id=ch.protonmail.android"
                            >
                                <img className="hauto" src={playStore} alt="Play Store" />
                            </Href>
                        </div>
                    </>
                )}
                {hasAlreadyImported ? null : (
                    <>
                        <div className="mb2 mt2" />
                        <div className="text-rg">
                            <ButtonLike
                                as={SettingsLink}
                                color="weak"
                                shape="outline"
                                path="/easy-switch"
                                app={APPS.PROTONMAIL}
                                target="_self"
                                className="inline-block mtauto"
                            >{c('Action').t`Import messages`}</ButtonLike>
                        </div>
                    </>
                )}
            </Container>
        </>
    );
};

export default WelcomePane;
