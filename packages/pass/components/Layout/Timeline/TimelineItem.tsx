import type { FC, PropsWithChildren } from 'react';

import timelineBottom from '@proton/pass/assets/history/timeline-bottom.svg';
import timelineMiddle from '@proton/pass/assets/history/timeline-middle.svg';
import timelineTop from '@proton/pass/assets/history/timeline-top.svg';
import type { Maybe } from '@proton/pass/types';

type Props = { index: number; total: number };

export const getTimelineImage = (index: number, total: number): Maybe<string> => {
    if (total <= 1) return;
    if (index === 0) return timelineTop;
    if (index < total - 1) return timelineMiddle;
    return timelineBottom;
};

export const TimelineItem: FC<PropsWithChildren<Props>> = ({ children, index, total }) => {
    const timelineImage = getTimelineImage(index, total);

    return (
        <div className="flex items-center flex-nowrap gap-2">
            {timelineImage && <img src={timelineImage} alt="" className="shrink-0" width={12} height={72} />}
            {children}
        </div>
    );
};
