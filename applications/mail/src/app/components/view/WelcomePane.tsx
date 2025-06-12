import type { ReactNode } from 'react';
import * as React from 'react';

import type { Location } from 'history';
import { c, msgid } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import { Loader, useTheme } from '@proton/components';
import { getInboxEmptyPlaceholder } from '@proton/mail/helpers/getPlaceholderSrc';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import type { MailSettings } from '@proton/shared/lib/interfaces';
import capitalize from '@proton/utils/capitalize';

import { contextTotal } from 'proton-mail/store/elements/elementsSelectors';
import { useMailSelector } from 'proton-mail/store/hooks';

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
}

const WelcomePane = ({ mailSettings, location }: Props) => {
    const theme = useTheme();

    const conversationMode = isConversationMode(MAILBOX_LABEL_IDS.INBOX, mailSettings, location);

    const [user, loadingUser] = useUser();

    const total = useMailSelector(contextTotal) || 0;

    const userName = (
        <span key="display-name" className="inline-block max-w-full text-ellipsis align-bottom">
            {capitalize(user.DisplayName)}
        </span>
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

    const counterMessage = getUnreadText(totalLabel);

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
                    <img
                        src={getInboxEmptyPlaceholder({
                            size: total,
                            theme: theme.information.theme,
                        })}
                        height={128}
                        className="w-auto"
                        alt=""
                    />
                </div>
                <h1 className="h3">{user.DisplayName ? c('Title').jt`Welcome ${userName}` : c('Title').t`Welcome`}</h1>
                {total ? <p className="my-2 p-0 text-keep-space">{counterMessage}</p> : null}
            </Container>
        </>
    );
};

export default WelcomePane;
