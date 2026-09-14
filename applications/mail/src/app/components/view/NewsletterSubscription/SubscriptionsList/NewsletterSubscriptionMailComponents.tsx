import { c, msgid } from 'ttag';

import SkeletonLoader from '@proton/components/components/skeletonLoader/SkeletonLoader';
import type { MARK_AS_STATUS } from '@proton/shared/lib/mail/constants';

import type { ElementsStructure } from '../../../../hooks/mailbox/useElements';
import type { MailboxActions } from '../../../../router/interface';
import type { SOURCE_ACTION } from '../../../list/list-telemetry/useListTelemetry';
import { MailToolbar } from '../../../toolbar/MailToolbar';
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
    elementsData: ElementsStructure;
    actions: MailboxActions;
}

export const NewsletterSubscriptionMailListToolbar = ({ elementsData, actions }: ToolbarProps) => {
    const overrideActions = {
        ...actions,
        // We override the handleMarkAs to prevent from moving back to the inbox when marking an email as unread
        handleMarkAs: (status: MARK_AS_STATUS, sourceAction: SOURCE_ACTION) =>
            actions.handleMarkAs(status, sourceAction, { preventBack: true }),
    };

    return (
        <section className="newsletter-subscription-list-title py-3">
            <MailToolbar placement="list" elementsData={elementsData} actions={overrideActions} />
        </section>
    );
};
