import { c, msgid } from 'ttag';

import type { PropsWithNewsletterSubscription } from '../interface';

interface Props extends PropsWithNewsletterSubscription {
    numMessages: number;
}

export const NewsletterSubscriptionListTitle = ({ subscription, numMessages }: Props) => {
    return (
        <div className="p-2 px-5 bg-weak shadow-norm">
            <h3 className="inline m-0 text-bold mr-2">{subscription.Name}</h3>
            <span className="text-sm color-weak">
                {c('Title').ngettext(msgid`${numMessages} message`, `${numMessages} messages`, numMessages)}
            </span>
        </div>
    );
};
