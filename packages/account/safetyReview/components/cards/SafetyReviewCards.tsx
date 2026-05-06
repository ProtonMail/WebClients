import type { ReactNode } from 'react';

import { SafetyReviewCard } from './SafetyReviewCard';
import type { SafetyReviewCardsItemProps } from './interface';

import './SafetyReviewCards.scss';

export const SafetyReviewCards = <T extends { id: string }>({
    header,
    items,
    footer,
    renderItem,
    stackContentReady = true,
}: {
    items: T[];
    header: ReactNode;
    footer: ReactNode;
    stackContentReady?: boolean;
    renderItem: (item: T | null, props: SafetyReviewCardsItemProps | null) => ReactNode;
}) => {
    const renderedCards = (() => {
        if (!stackContentReady) {
            return [];
        }
        if (items.length === 0) {
            const currentProps: SafetyReviewCardsItemProps = { firstItemId: 'empty' };
            return [
                <SafetyReviewCard id="empty" key="empty" index={0}>
                    {renderItem(null, currentProps)}
                </SafetyReviewCard>,
            ];
        }
        return [...items].reverse().map((item, index, array) => {
            const reversedIndex = array.length - index - 1;
            const isTop = reversedIndex === 0;
            const currentProps: SafetyReviewCardsItemProps = isTop ? { firstItemId: item.id } : {};
            return (
                <SafetyReviewCard id={item.id} key={item.id} index={reversedIndex}>
                    {renderItem(item, currentProps)}
                </SafetyReviewCard>
            );
        });
    })();

    return (
        <div className="flex flex-column items-center">
            <div className="safety-review--container">
                {header}
                <div className="safety-review--stack relative mb-12">{renderedCards}</div>
                {footer}
            </div>
        </div>
    );
};
