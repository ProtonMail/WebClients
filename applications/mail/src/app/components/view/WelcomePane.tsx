import * as React from 'react';

import { Location } from 'history';
import { c, msgid } from 'ttag';

import {
    Loader,
    usePlans,
    useTheme,
    useUser,
    useUserSettings,
} from '@proton/components';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { MailSettings } from '@proton/shared/lib/interfaces';
import { LabelCount } from '@proton/shared/lib/interfaces/Label';
import envelope from '@proton/styles/assets/img/illustrations/welcome-pane.svg';
import capitalize from '@proton/utils/capitalize';

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

    const [user, loadingUser] = useUser();
    const [plans = [], loadingPlans] = usePlans();
    const [theme] = useTheme();
    const [userSettings, loadingUserSettings] = useUserSettings();
    const loading = loadingUser || loadingPlans || loadingUserSettings;

    const unread = labelCount?.Unread || 0;
    const total = labelCount?.Total || 0;

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
            {user.hasPaidMail ? null : <WelcomePaneBanner plans={plans} userSettings={userSettings} theme={theme} />}
            <Container>
                <h1>{user.DisplayName ? c('Title').jt`Welcome ${userName}` : c('Title').t`Welcome`}</h1>
                <p className="text-keep-space">{labelCount ? counterMessage : null}</p>
                <hr className="mb2 mt2" />
                <div className="text-rg">
                    <img className="hauto" src={envelope} alt={c('Alternative text for welcome image').t`Welcome`} />
                </div>
            </Container>
        </>
    );
};

export default WelcomePane;
