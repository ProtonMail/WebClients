import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

import { LayoutSetting } from '@proton/shared/lib/interfaces/drive/userSettings';

import { logPerformanceMarker } from '../../utils/performance';

// We need a number that represent a "page" of items on the DOM
// When we render 10 items, we consider it a "page" for the sake of metrics
const PAGE_RENDERED_ON_THE_DOM_ITEM_COUNT = 10;

export const useOnItemRenderedMetrics = (layout: LayoutSetting, isLoading: boolean) => {
    const location = useLocation();
    const prevLocationRef = useRef(location);

    const [count, setCount] = useState<number>(0);
    const [firstItemIsSet, setFirstItemIsSet] = useState<boolean>(false);
    const [firstPageIsSet, setFirstPageIsSet] = useState<boolean>(false);
    const [lastPageIsSet, setLastPageIsSet] = useState<boolean>(false);
    const view = layout === LayoutSetting.List ? 'list' : 'grid';

    const resetItemRenderedCounter = () => {
        setCount(0);
        setFirstItemIsSet(false);
        setLastPageIsSet(false);
        setLastPageIsSet(false);
    };

    useEffect(() => {
        if (firstItemIsSet === false && count > 0) {
            setFirstItemIsSet(true);
            logPerformanceMarker('drive_performance_clicktofirstitemrendered_histogram', view);
        }

        if (firstPageIsSet === false && count >= PAGE_RENDERED_ON_THE_DOM_ITEM_COUNT) {
            setFirstPageIsSet(true);
            logPerformanceMarker('drive_performance_clicktofirstpagerendered_histogram', view);
        }

        if (isLoading === false && lastPageIsSet === false && count > 0) {
            setLastPageIsSet(true);
            const totalTime = logPerformanceMarker('drive_performance_clicktolastitemrendered_histogram', view);
            if (totalTime) {
                logPerformanceMarker('drive_performance_averagetimeperitem_histogram', view, totalTime / count);
            }
        }

        // This prevents Events data after page is loaded to be counted like it was part of the navigation
        if (isLoading === false) {
            setFirstItemIsSet(true);
            setLastPageIsSet(true);
            setLastPageIsSet(true);
        }
    }, [count, isLoading]);

    useEffect(() => {
        const prevLocation = prevLocationRef.current;
        prevLocationRef.current = location;

        // Don't log if it's the initial render
        if (prevLocation === location) {
            return;
        }

        resetItemRenderedCounter();
    }, [location]);

    const incrementItemRenderedCounter = useCallback(() => {
        // no point increasing count further after lastPageSet is true
        if (lastPageIsSet === false) {
            setCount((prevState) => prevState + 1);
        }
    }, [lastPageIsSet]);

    return {
        incrementItemRenderedCounter,
    };
};
