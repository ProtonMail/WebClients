import { type PropsWithChildren, useRef } from 'react';

import { Scroll } from '@proton/atoms';

import { NewsletterSubscriptionListHeader } from './NewsletterSubscriptionListHeader';

interface Props extends PropsWithChildren {
    isDisplayingPlaceholder?: boolean;
}

export const NewsletterSubscriptionListWrapper = ({ isDisplayingPlaceholder = false, children }: Props) => {
    const scrollRef = useRef<HTMLDivElement>(null);

    // We scroll to the top when we change tab
    const handleScrollToTop = () => {
        scrollRef.current?.scrollTo({ top: 0, behavior: 'instant' });
    };

    return (
        <>
            <div className="flex-1 flex flex-column flex-nowrap border-right border-weak h-full">
                <NewsletterSubscriptionListHeader tabClickCallback={handleScrollToTop} />
                {isDisplayingPlaceholder ? (
                    <div className="flex flex-1 w-full h-full flex-nowrap">{children}</div>
                ) : (
                    <Scroll className="flex-1 w-full" customContainerRef={scrollRef}>
                        <div className="flex px-6 flex-column flex-nowrap pb-4 px-1">{children}</div>
                    </Scroll>
                )}
            </div>
        </>
    );
};
