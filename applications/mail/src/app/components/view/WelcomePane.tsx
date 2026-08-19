import * as React from 'react';
import { useLocation } from 'react-router-dom';

import { c, msgid } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import Loader from '@proton/components/components/loader/Loader';
import { useTheme } from '@proton/components/containers/themes/ThemeProvider';
import { getInboxEmptyPlaceholder } from '@proton/mail/helpers/getPlaceholderSrc';
import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import capitalize from '@proton/utils/capitalize';

import { useMailboxCounter } from '../../hooks/mailboxCounter/useMailboxCounter';

import { isConversationMode } from '../../helpers/mailSettings';

interface ContainerProps {
    children: React.ReactNode;
}

const Container = ({ children }: ContainerProps) => (
    <section aria-labelledby="welcome-header" className="flex h-full overflow-auto py-4 px-7">
        <div className="m-auto text-center max-w-custom" style={{ '--max-w-custom': '30em' }}>
            {children}
        </div>
    </section>
);

const WelcomePane = () => {
    const theme = useTheme();
    const location = useLocation();
    const [user, loadingUser] = useUser();
    const [mailSettings] = useMailSettings();

    const { getLocationCount } = useMailboxCounter();
    const conversationMode = isConversationMode(MAILBOX_LABEL_IDS.INBOX, mailSettings, location);

    if (loadingUser) {
        return (
            <Container>
                <Loader />
            </Container>
        );
    }

    const userName = (
        <span key="display-name" className="inline-block max-w-full text-ellipsis align-bottom">
            {capitalize(user.DisplayName)}
        </span>
    );

    const total = getLocationCount(MAILBOX_LABEL_IDS.INBOX, { ignoreCategories: true })?.Total || 0;
    const totalCopy = conversationMode
        ? c('Info').ngettext(msgid`${total} conversation`, `${total} conversations`, total)
        : c('Info').ngettext(msgid`${total} message`, `${total} messages`, total);

    const totalLabel = <strong key="total-label">{totalCopy}</strong>;

    return (
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
            <h1 className="text-lg text-semibold color-weak" id="welcome-header">
                {user.DisplayName ? c('Title').jt`Welcome ${userName}` : c('Title').t`Welcome`}
            </h1>
            {total ? (
                <p className="my-2 p-0 color-weak text-keep-space">{c('Info')
                    .jt`You have ${totalLabel} in your inbox.`}</p>
            ) : null}
        </Container>
    );
};

export default WelcomePane;
