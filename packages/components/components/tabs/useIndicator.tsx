import { useEffect, useRef, useState } from 'react';
import { Tab } from './index.d';

const getWidth = (el: HTMLLIElement | HTMLUListElement) => {
    return el.getClientRects()?.[0]?.width ?? 0;
};

const getComputedMargin = (el: HTMLLIElement) => {
    const value = window.getComputedStyle(el)?.marginRight;
    if (value.includes('px')) {
        return Number(value.slice(0, -2));
    }
    return 0;
};

const INITIAL_STATE = {
    scale: 0,
    translate: '0px',
};

export const useIndicator = (tabs: Tab[], currentTabIndex: number) => {
    const tabsRef = useRef<HTMLUListElement>(null);

    const [{ scale, translate }, setIndicatorParams] = useState(INITIAL_STATE);

    // on each route change, recalculate indicator offset and scale
    useEffect(() => {
        const tabsEl = tabsRef.current;
        if (!tabsEl) {
            setIndicatorParams(INITIAL_STATE);
            return;
        }
        const tabsListItems = tabsEl.querySelectorAll<HTMLLIElement>('.tabs-list-item');
        const tabProperties = [...tabsListItems].map((el) => ({
            width: getWidth(el),
            margin: getComputedMargin(el),
        }));
        const totalTabWidth = tabProperties.reduce((acc, { width, margin }) => acc + width + margin, 0);

        if (totalTabWidth > getWidth(tabsEl)) {
            setIndicatorParams(INITIAL_STATE);
            return;
        }

        const { offset, width } = tabProperties.reduce(
            (acc, { width, margin }, index) => {
                // for each tab before current, add its width and margin to offset
                if (index < currentTabIndex) {
                    acc.offset += width + margin;
                }
                // for current tab, set indicator width equal to tab width
                if (index === currentTabIndex) {
                    acc.width = width;
                }
                return acc;
            },
            { offset: 0, width: 0 }
        );
        // indicator scale is proportion to whole container width
        setIndicatorParams({
            scale: width / getWidth(tabsEl),
            translate: `${offset}px`,
        });
    }, [tabs, currentTabIndex]);

    return {
        scale,
        translate,
        ref: tabsRef,
    };
};
