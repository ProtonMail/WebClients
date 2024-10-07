import type { ReactNode } from 'react';
import * as React from 'react';

import type { Location } from 'history';
import { c, msgid } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import { Loader } from '@proton/components';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import type { MailSettings } from '@proton/shared/lib/interfaces';
import type { LabelCount } from '@proton/shared/lib/interfaces/Label';
import envelope from '@proton/styles/assets/img/illustrations/welcome-pane.svg';
import capitalize from '@proton/utils/capitalize';

import { getNUnreadConversationsText, getNUnreadMessagesText } from 'proton-mail/helpers/text';

import { isConversationMode } from '../../helpers/mailSettings';

interface ContainerProps {
    children: React.ReactNode;
}

const Container = ({ children }: ContainerProps) => (
    <div className="flex h-full overflow-auto py-4 px-7">
        <div className="m-auto text-center max-w-custom" style={{ '--max-w-custom': '30em' }}>
            {children}
        </div>
    </div>
);

interface Props {
    mailSettings: MailSettings;
    location: Location;
    labelCount: LabelCount | undefined;
}

const WelcomePane = ({ mailSettings, location, labelCount }: Props) => {
    const conversationMode = isConversationMode(MAILBOX_LABEL_IDS.INBOX, mailSettings, location);

    const [user, loadingUser] = useUser();

    const unread = labelCount?.Unread || 0;
    const total = labelCount?.Total || 0;

    const userName = (
        <span key="display-name" className="inline-block max-w-full text-ellipsis align-bottom">
            {capitalize(user.DisplayName)}
        </span>
    );

    const unreadsLabel = conversationMode ? (
        <strong key="unreads-label">{getNUnreadConversationsText(unread)}</strong>
    ) : (
        <strong key="unreads-label">{getNUnreadMessagesText(unread)}</strong>
    );

    const totalLabel = conversationMode ? (
        <strong key="total-label">
            {c('Info').ngettext(msgid`${total} conversation`, `${total} conversations`, total)}
        </strong>
    ) : (
        <strong key="total-label">{c('Info').ngettext(msgid`${total} message`, `${total} messages`, total)}</strong>
    );

    const getUnreadText = (unread: ReactNode) => {
        return c('Info').jt`You have ${unread} in your inbox.`;
    };

    const counterMessage = unread ? getUnreadText(unreadsLabel) : getUnreadText(totalLabel);

    if (loadingUser) {
        return (
            <Container>
                <Loader />
            </Container>
        );
    }

    return (
        <>
            <Container>
                <div className="text-rg mb-4">
                    <img src={envelope} width={96} height={90} alt="" />
                </div>
                <h3>{user.DisplayName ? c('Title').jt`Welcome ${userName}` : c('Title').t`Welcome`}</h3>
                <p className="my-2 p-0 text-keep-space">{labelCount ? counterMessage : null}</p>
            </Container>
        </>
    );
};

export default WelcomePane;
