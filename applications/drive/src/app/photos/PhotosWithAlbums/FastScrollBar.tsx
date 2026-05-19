import type { FC } from 'react';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';

import { c } from 'ttag';

import { useElementRect } from '@proton/components';
import clsx from '@proton/utils/clsx';

import { usePhotosStore } from '../usePhotos.store';

import './FastScrollBar.scss';

const MIN_COMFORTABLE_HEIGHT = 16;
const DOT_MIN_HEIGHT = 4;
const MINIMUM_ITEMS_FOR_FAST_SCROLL = 50; // Below 50 items, we do not show fast scroll

export interface FastScrollBarProps {
    uids: string[];
    containerHeight: number;
    containerRef: React.RefObject<HTMLDivElement>;
    containerRect: DOMRect;
    groupsPositions: React.RefObject<Map<string, number>>;
    innerStyle: { height: number; itemWidth: number };
    isScrolling: boolean;
    currentTopGroup: { year: number; month: number } | undefined;
}

interface ScrollElement {
    position: number;
    height: number;
    year: number;
    month: number;
    rows: number;
    isLast: boolean;
    monthName: string;
    dataKey: string;
}

const dateCache = new Map<number, { year: number; month: number } | null>();

export const getYearAndMonthFromCaptureTime = (captureTime?: Date): { year: number; month: number } | null => {
    if (!captureTime) {
        return null;
    }

    const timestamp = captureTime.getTime();

    if (dateCache.has(timestamp)) {
        return dateCache.get(timestamp) ?? null;
    }

    if (isNaN(timestamp)) {
        dateCache.set(timestamp, null);
        return null;
    }

    const result = {
        year: captureTime.getFullYear(),
        month: captureTime.getMonth(),
    };
    dateCache.set(timestamp, result);
    return result;
};

export const getMonthName = (month: number): string => {
    const MONTH_NAMES = [
        // translator: shorthand for January
        c('Info').t`Jan`,
        // translator: shorthand for February
        c('Info').t`Feb`,
        // translator: shorthand for March
        c('Info').t`Mar`,
        // translator: shorthand for April
        c('Info').t`Apr`,
        // translator: shorthand for May
        c('Info').t`May`,
        // translator: shorthand for June
        c('Info').t`Jun`,
        // translator: shorthand for July
        c('Info').t`Jul`,
        // translator: shorthand for August
        c('Info').t`Aug`,
        // translator: shorthand for September
        c('Info').t`Sep`,
        // translator: shorthand for October
        c('Info').t`Oct`,
        // translator: shorthand for November
        c('Info').t`Nov`,
        // translator: shorthand for December
        c('Info').t`Dec`,
    ];
    return MONTH_NAMES[month - 1] || '';
};

export const FastScrollBar: FC<FastScrollBarProps> = ({
    uids,
    containerRef,
    containerRect,
    containerHeight,
    groupsPositions,
    innerStyle,
    isScrolling,
    currentTopGroup,
}) => {
    const scrollBarRef = useRef<HTMLDivElement>(null);
    const thumbRef = useRef<HTMLDivElement>(null);
    const scrollBarRect = useElementRect(scrollBarRef);

    // Cache for scroll element DOM nodes
    const elementRefsCache = useRef<Map<string, HTMLButtonElement>>(new Map());

    const scrollElements = useMemo<ScrollElement[]>(() => {
        if (!containerHeight || uids.length === 0) {
            return [];
        }

        const containerWidth = containerRect.width;
        const itemWidth = innerStyle.itemWidth;
        const itemsPerRow = Math.max(1, Math.floor(containerWidth / itemWidth));

        const { photoItems } = usePhotosStore.getState();
        const itemCountByYearMonth = new Map<number, Map<number, number>>();

        for (const uid of uids) {
            const item = photoItems.get(uid);
            if (!item) {
                continue;
            }

            const ym = getYearAndMonthFromCaptureTime(item.captureTime);
            if (!ym) {
                continue;
            }

            const { year, month } = ym;

            let yearMap = itemCountByYearMonth.get(year);
            if (!yearMap) {
                yearMap = new Map();
                itemCountByYearMonth.set(year, yearMap);
            }

            yearMap.set(month, (yearMap.get(month) ?? 0) + 1);
        }

        const entries: { year: number; month: number; rows: number }[] = [];
        const sortedYears = Array.from(itemCountByYearMonth.keys()).sort((a, b) => a - b);

        for (const year of sortedYears) {
            const monthMap = itemCountByYearMonth.get(year);
            if (!monthMap) {
                continue;
            }
            const sortedMonths = Array.from(monthMap.keys()).sort((a, b) => a - b);

            for (const month of sortedMonths) {
                const count = monthMap.get(month) ?? 0;
                entries.push({
                    year,
                    month: month + 1,
                    rows: Math.ceil(count / itemsPerRow),
                });
            }
        }

        const totalRows = entries.reduce((sum, e) => sum + e.rows, 0);
        const totalMinHeight = entries.length * DOT_MIN_HEIGHT;
        const extraSpace = Math.max(0, containerHeight - totalMinHeight);

        const elements: ScrollElement[] = [];
        let runningPos = 0;

        for (let i = 0; i < entries.length; i++) {
            const e = entries[i];
            const height = DOT_MIN_HEIGHT + (totalRows > 0 ? (e.rows / totalRows) * extraSpace : 0);
            const isLast = i === 0 || entries[i - 1].year !== e.year;

            elements.unshift({
                position: runningPos,
                height,
                year: e.year,
                month: e.month,
                rows: e.rows,
                isLast,
                monthName: getMonthName(e.month),
                dataKey: `${e.year}-${e.month}`,
            });

            runningPos += height;
        }

        return elements;
    }, [containerHeight, containerRect.width, innerStyle.itemWidth, uids]);

    const handleElementClick = useCallback(
        (element: ScrollElement, behavior: ScrollBehavior = 'smooth') => {
            if (!containerRef.current || !groupsPositions.current) {
                return;
            }

            const groupPosition = groupsPositions.current.get(`${element.year}-${element.month - 1}`);
            if (groupPosition !== undefined) {
                containerRef.current.scrollTo({
                    top: groupPosition,
                    behavior,
                });
            }
        },
        [containerRef, groupsPositions]
    );

    useEffect(() => {
        if (!thumbRef.current || !currentTopGroup || !scrollBarRect) {
            return;
        }

        const key = `${currentTopGroup.year}-${currentTopGroup.month + 1}`;
        const cachedElement = elementRefsCache.current.get(key);

        if (cachedElement) {
            const stepRect = cachedElement.getBoundingClientRect();
            thumbRef.current.style.top = `${stepRect.top - scrollBarRect.top + stepRect.height / 2 - 1}px`;
        }
    }, [currentTopGroup, scrollBarRect]);

    const density = useMemo(() => {
        return scrollElements.length > 0
            ? Math.ceil(MIN_COMFORTABLE_HEIGHT / (containerHeight / scrollElements.length))
            : 1;
    }, [scrollElements.length, containerHeight]);

    const isElementVisible = useCallback(
        (index: number, element: ScrollElement) => {
            return (index + 1) % density === 0 || index === 0 || index === scrollElements.length - 1 || element.isLast;
        },
        [density, scrollElements.length]
    );

    if (uids.length < MINIMUM_ITEMS_FOR_FAST_SCROLL) {
        return null;
    }

    return (
        <>
            <div
                className={clsx('fast-scroll-bar', isScrolling && 'is-scrolling')}
                style={{ blockSize: `${containerHeight}px` }}
                ref={scrollBarRef}
            >
                {scrollElements.map((el, i) => (
                    // eslint-disable-next-line jsx-a11y/no-aria-hidden-on-focusable
                    <button
                        key={el.dataKey}
                        ref={(node) => {
                            if (node) {
                                elementRefsCache.current.set(el.dataKey, node);
                            } else {
                                elementRefsCache.current.delete(el.dataKey);
                            }
                        }}
                        aria-hidden="true"
                        className={clsx(
                            'fast-scroll-dot',
                            el.isLast && 'fast-scroll-last-month',
                            isElementVisible(i, el) ? 'opacity-display' : 'opacity-hidden'
                        )}
                        style={{ height: `${el.height}px` }}
                        onMouseUp={() => handleElementClick(el)}
                        onMouseEnter={(e) => {
                            if (e.buttons === 1) {
                                handleElementClick(el, 'instant');
                            }
                        }}
                        data-monthyear={`${el.monthName} ${el.year}`}
                        data-top={`${el.position}px`}
                        data-year={el.year}
                        data-month={el.month}
                        data-right={`${scrollBarRect?.right || 0}px`}
                    />
                ))}
            </div>
            <div className="scrollbar-thumb" ref={thumbRef}>
                {currentTopGroup && (
                    <span>
                        {getMonthName(currentTopGroup.month + 1)} {currentTopGroup.year}
                    </span>
                )}
            </div>
        </>
    );
};
