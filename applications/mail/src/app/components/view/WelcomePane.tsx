import React from 'react';
import {
    useUser,
    AppLink,
    Href,
    useImporters,
    useFeature,
    FeatureCode,
    Loader,
    ButtonLike,
    SettingsLink,
} from 'react-components';
import { c, msgid } from 'ttag';
import { Location } from 'history';
import { MailSettings } from 'proton-shared/lib/interfaces';
import { MAILBOX_LABEL_IDS, APPS } from 'proton-shared/lib/constants';
import { capitalize } from 'proton-shared/lib/helpers/string';
import { LabelCount } from 'proton-shared/lib/interfaces/Label';
import envelope from 'design-system/assets/img/placeholders/welcome-pane.svg';
import mobileMailApp from 'design-system/assets/img/placeholders/app-teaser.svg';
import appStore from 'design-system/assets/img/shared/app-store.svg';
import playStore from 'design-system/assets/img/shared/play-store.svg';

import { isConversationMode } from '../../helpers/mailSettings';

interface ContainerProps {
    children: React.ReactNode;
}

const Container = ({ children }: ContainerProps) => (
    <div className="flex h100 scroll-if-needed pt1 pb1 pr2 pl2">
        <div className="mauto text-center max-w30e">{children}</div>
    </div>
);
interface Props {
    mailSettings: MailSettings;
    location: Location;
    labelCount: LabelCount;
}

const WelcomePane = ({ mailSettings, location, labelCount }: Props) => {
    const conversationMode = isConversationMode(MAILBOX_LABEL_IDS.INBOX, mailSettings, location);
    const { feature: featureUsedMailMobileApp, loading: loadingUsedMailMobileApp } = useFeature(
        FeatureCode.UsedMailMobileApp
    );

    const [user, loadingUser] = useUser();
    const [imports = [], importsLoading] = useImporters();
    const hasAlreadyImported = imports.length;
    const loading = importsLoading || loadingUsedMailMobileApp || loadingUser;

    const unread = labelCount.Unread || 0;
    const total = labelCount.Total || 0;
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

    if (loading) {
        return (
            <Container>
                <Loader />
            </Container>
        );
    }

    return (
        <>
            {user.hasPaidMail ? null : (
                <div className="bg-primary p1 text-center">
                    <span className="mr1">{c('Info').jt`Increase storage space starting at $4/month.`}</span>
                    <SettingsLink path="/dashboard" className="text-bold link align-baseline color-inherit">
                        {c('Action').t`Upgrade`}
                    </SettingsLink>
                </div>
            )}
            <Container>
                <h1>{user.DisplayName ? c('Title').jt`Welcome ${userName}` : c('Title').t`Welcome`}</h1>
                <p>
                    {unread
                        ? c('Info').jt`You have ${unreadsLabel} in your inbox.`
                        : c('Info').jt`You have ${totalLabel} in your inbox.`}
                </p>
                <div className="mb2 mt2" />
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
                                as={AppLink}
                                color="weak"
                                shape="outline"
                                to="/mail/import-export"
                                toApp={APPS.PROTONACCOUNT}
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
