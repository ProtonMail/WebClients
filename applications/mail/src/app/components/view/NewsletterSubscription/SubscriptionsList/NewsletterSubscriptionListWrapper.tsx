import { type PropsWithChildren } from 'react';

import { NewsletterSubscriptionListHeader } from './NewsletterSubscriptionListHeader';

export const NewsletterSubscriptionListWrapper = ({ children }: PropsWithChildren) => {
    return (
        <>
            <div className="flex-1 px-6 pt-5 border-right border-weak h-full">
                <NewsletterSubscriptionListHeader />
                <section
                    className="flex flex-column flex-nowrap gap-4 h-custom overflow-auto pb-4 px-1"
                    style={{ '--h-custom': 'calc(100% - 3.5rem)' }}
                >
                    {children}
                </section>
            </div>
        </>
    );
};
