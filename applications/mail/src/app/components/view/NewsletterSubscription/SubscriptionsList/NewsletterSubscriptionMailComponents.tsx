import { c, msgid } from 'ttag';

import { SkeletonLoader } from '@proton/components';
import type { MARK_AS_STATUS } from '@proton/shared/lib/mail/constants';

import type { SOURCE_ACTION } from 'proton-mail/components/list/useListTelemetry';
import type { ElementsStructure } from 'proton-mail/hooks/mailbox/useElements';
import { MailboxToolbar } from 'proton-mail/router/components/MailboxToolbar';
import type { MailboxActions, RouterNavigation } from 'proton-mail/router/interface';
import type { ElementsStateParams } from 'proton-mail/store/elements/elementsTypes';

import type { PropsWithNewsletterSubscription } from '../interface';

import './NewsletterSubscriptionListTitle.scss';

interface HeaderProps extends PropsWithNewsletterSubscription {
    numMessages: number;
    loading: boolean;
}

export const NewsletterSubscriptionMailListHeader = ({ subscription, numMessages, loading }: HeaderProps) => {
    return (
        <div className="newsletter-subscription-list-title py-4 px-4">
            <section className="h-custom flex items-baseline" style={{ '--h-custom': '2.25rem' }}>
                <h1 className="h3 inline m-0 text-bold text-xl mr-2">{subscription.Name}</h1>
                {loading ? (
                    <SkeletonLoader width="4rem" height="1.25rem" />
                ) : (
                    <span className="text-sm color-weak">
                        {c('Title').ngettext(msgid`${numMessages} message`, `${numMessages} messages`, numMessages)}
                    </span>
                )}
            </section>
        </div>
    );
};

interface ToolbarProps {
    params: ElementsStateParams;
    navigation: RouterNavigation;
    elementsData: ElementsStructure;
    actions: MailboxActions;
}

export const NewsletterSubscriptionMailListToolbar = ({ params, navigation, elementsData, actions }: ToolbarProps) => {
    const overrideActions = {
        ...actions,
        // We override the handleMarkAs to prevent from moving back to the inbox when marking an email as unread
        handleMarkAs: (status: MARK_AS_STATUS, sourceAction: SOURCE_ACTION) =>
            actions.handleMarkAs(status, sourceAction, { preventBack: true }),
    };

    return (
        <section className="newsletter-subscription-list-title py-3">
            <MailboxToolbar
                params={params}
                navigation={navigation}
                elementsData={elementsData}
                actions={overrideActions}
                /* Force the columnLayout to be false to visually align with single line toolbar*/
                overrideColumnMode={false}
            />
        </section>
    );
};
