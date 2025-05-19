import { type PropsWithChildren } from 'react';

import { Scroll } from '@proton/atoms';

import { NewsletterSubscriptionListHeader } from './NewsletterSubscriptionListHeader';

export const NewsletterSubscriptionListWrapper = ({ children }: PropsWithChildren) => {
    return (
        <>
            <div className="flex-1 border-right border-weak h-full">
                <NewsletterSubscriptionListHeader />
                <Scroll className="h-custom" style={{ '--h-custom': 'calc(100% - 4.5rem)' }}>
                    <section className="flex px-6 flex-column flex-nowrap gap-4 pb-4 px-1 ">{children}</section>
                </Scroll>
            </div>
        </>
    );
};
