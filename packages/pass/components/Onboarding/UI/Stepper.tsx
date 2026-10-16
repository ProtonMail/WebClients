import type { FC, ReactNode } from 'react';
import { useLayoutEffect, useRef, useState } from 'react';

import clsx from '@proton/utils/clsx';

import type { Maybe } from '../../../types';

import './Stepper.scss';

type Props = {
    steps: ReactNode[];
    hrefs?: Maybe<string>[];
    active: number;
    className?: string;
};

type Segment = { start: number; end: number };
type Frame = { height: number; segments: Segment[] };

const STROKE = 1;

/** Each step is outlined with a single path: a round cap on the outer ends of the
 * stepper, a 45° chevron tip protruding into the gap on the right, and a matching
 * notch on the left. The tip and notch of two neighbours stay parallel, so the gap
 * between them keeps the flex `gap` width and remains transparent. */
const getSegmentPath = ({ start, end }: Segment, height: number, first: boolean, last: boolean) => {
    const top = STROKE / 2;
    const bottom = height - STROKE / 2;
    const middle = height / 2;
    const radius = middle - STROKE / 2;
    const depth = middle - STROKE / 2;

    const left = first ? start + radius : start;
    const right = last ? end - radius : end;

    const rightEdge = last
        ? `A ${radius} ${radius} 0 0 1 ${right} ${bottom}`
        : `L ${end + depth} ${middle} L ${end} ${bottom}`;
    const leftEdge = first ? `A ${radius} ${radius} 0 0 1 ${left} ${top}` : `L ${start + depth} ${middle} Z`;

    return `M ${left} ${top} H ${right} ${rightEdge} H ${left} ${leftEdge}`;
};

const measure = (container: HTMLElement): Frame => ({
    height: container.offsetHeight,
    segments: Array.from(container.children)
        .filter((child): child is HTMLElement => child instanceof HTMLElement)
        .map(({ offsetLeft, offsetWidth }) => ({ start: offsetLeft, end: offsetLeft + offsetWidth })),
});

export const Stepper: FC<Props> = ({ steps, hrefs = [], active, className }) => {
    const ref = useRef<HTMLDivElement>(null);
    const [frame, setFrame] = useState<Frame>({ height: 0, segments: [] });

    useLayoutEffect(() => {
        const container = ref.current;
        if (!container) return;

        const observer = new ResizeObserver(() => setFrame(measure(container)));
        observer.observe(container);
        return () => observer.disconnect();
    }, []);

    return (
        <div ref={ref} className={clsx('pass-onboarding-stepper flex flex-row gap-3', className)}>
            <svg className="pass-onboarding-stepper-shapes" aria-hidden="true">
                {frame.segments.map((segment, index) => (
                    <path
                        key={index}
                        className={clsx(index === active && 'active')}
                        d={getSegmentPath(segment, frame.height, index === 0, index === frame.segments.length - 1)}
                    />
                ))}
            </svg>

            {steps.map((step, index) => {
                const href = hrefs[index];
                const DivOrLink = href ? 'a' : 'div';

                return (
                    <DivOrLink key={index} className="flex-1 p-4 flex justify-center items-center" href={href}>
                        {step}
                    </DivOrLink>
                );
            })}
        </div>
    );
};
