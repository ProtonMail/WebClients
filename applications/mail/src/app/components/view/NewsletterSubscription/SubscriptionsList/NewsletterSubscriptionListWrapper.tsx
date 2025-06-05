import { type PropsWithChildren } from 'react';

import { Scroll } from '@proton/atoms';

import { NewsletterSubscriptionListHeader } from './NewsletterSubscriptionListHeader';

interface Props extends PropsWithChildren {
    isDisplayingPlaceholder?: boolean;
}

const customHeight = 'calc(100% - 4.5rem)';

export const NewsletterSubscriptionListWrapper = ({ isDisplayingPlaceholder = false, children }: Props) => {
    return (
        <>
            <div className="flex-1 border-right border-weak h-full">
                <NewsletterSubscriptionListHeader />
                {isDisplayingPlaceholder ? (
                    <section className="h-custom flex flex-nowrap" style={{ '--h-custom': customHeight }}>
                        {children}
                    </section>
                ) : (
                    <Scroll className="h-custom" style={{ '--h-custom': customHeight }}>
                        <section className="flex pl-6 pr-3 flex-column flex-nowrap gap-4 pb-4">{children}</section>
                    </Scroll>
                )}
            </div>
        </>
    );
};
