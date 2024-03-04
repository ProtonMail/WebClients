import type { FC, PropsWithChildren } from 'react';
import { Children } from 'react';

import { TimelineItem } from './TimelineItem';

export const Timeline: FC<PropsWithChildren> = ({ children }) => (
    <div>
        {Children.toArray(children).map((child, idx, { length }) => (
            <TimelineItem index={idx} total={length} key={`timeline-item-${idx}`}>
                {child}
            </TimelineItem>
        ))}
    </div>
);
