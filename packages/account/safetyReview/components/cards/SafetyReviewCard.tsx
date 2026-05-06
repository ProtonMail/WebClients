import type { ReactNode } from 'react';

import { Scroll } from '@proton/atoms/Scroll/Scroll';
import clsx from '@proton/utils/clsx';

import './SafetyReviewCard.scss';

export interface SafetyReviewCardProps {
    children: ReactNode;
    id: string;
    index: number;
}

export const SafetyReviewCard = ({ id, children, index }: SafetyReviewCardProps) => {
    return (
        <div
            className={clsx(
                'safety-review--card absolute h-full w-full bg-elevated overflow-hidden',
                index === 0 && 'safety-review--card-top'
            )}
            style={{
                '--card-index': index,
                viewTransitionName: `safety-review-card-enter-${index}`,
            }}
            data-testid={id}
        >
            <Scroll>
                <div className="p-4 md:p-8">{children}</div>
            </Scroll>
        </div>
    );
};
