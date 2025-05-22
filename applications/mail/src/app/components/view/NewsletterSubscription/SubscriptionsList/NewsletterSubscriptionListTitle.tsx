import { c, msgid } from 'ttag';

import type { NewsletterSubscription } from '@proton/shared/lib/interfaces/NewsletterSubscription';

interface Props {
    activeSubscription: NewsletterSubscription;
    numMessages: number;
}

export const NewsletterSubscriptionListTitle = ({ activeSubscription, numMessages }: Props) => {
    return (
        <div className="flex flex-row items-end p-2 px-5 bg-weak shadow-norm">
            <h3 className="m-0 text-bold">{activeSubscription?.Name}</h3>
            <p className="m-0 mb-1 ml-3 text-sm">{c('Title').ngettext(msgid`Message`, `Messages`, numMessages)}</p>
        </div>
    );
};
