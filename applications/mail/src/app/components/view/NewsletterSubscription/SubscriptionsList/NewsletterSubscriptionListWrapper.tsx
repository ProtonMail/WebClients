import { type PropsWithChildren } from 'react';

import { NewsletterSubscriptionListHeader } from './NewsletterSubscriptionListHeader';

export const NewsletterSubscriptionListWrapper = ({ children }: PropsWithChildren) => {
    return (
        <>
            <div className="flex-1 border-right border-weak h-full overflow-auto">
                <NewsletterSubscriptionListHeader />
                <section className="flex px-6 flex-column flex-nowrap gap-4 pb-4 px-1">{children}</section>
            </div>
        </>
    );
};
