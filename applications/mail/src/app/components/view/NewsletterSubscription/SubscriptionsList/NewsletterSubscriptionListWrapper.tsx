import { type PropsWithChildren, useRef } from 'react';

import { Scroll } from '@proton/atoms';

import { NewsletterSubscriptionListHeader } from './NewsletterSubscriptionListHeader';

interface Props extends PropsWithChildren {
    isDisplayingPlaceholder?: boolean;
}

const customHeight = 'calc(100% - 4.5rem)';

export const NewsletterSubscriptionListWrapper = ({ isDisplayingPlaceholder = false, children }: Props) => {
    const scrollRef = useRef<HTMLDivElement>(null);

    // We scroll to the top when we change tab
    const handleScrollToTop = () => {
        scrollRef.current?.scrollTo({ top: 0, behavior: 'instant' });
    };

    return (
        <>
            <div className="flex-1 border-right border-weak h-full">
                <NewsletterSubscriptionListHeader tabClickCallback={handleScrollToTop} />
                {isDisplayingPlaceholder ? (
                    <div className="h-custom flex flex-nowrap" style={{ '--h-custom': customHeight }}>
                        {children}
                    </div>
                ) : (
                    <Scroll className="h-custom" style={{ '--h-custom': customHeight }} customContainerRef={scrollRef}>
                        <div className="flex px-6 flex-column flex-nowrap pb-4 px-1">{children}</div>
                    </Scroll>
                )}
            </div>
        </>
    );
};
