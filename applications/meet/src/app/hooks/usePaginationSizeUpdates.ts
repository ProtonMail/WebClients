import { useEffect } from 'react';

import { PAGE_SIZE, SCREEN_SHARE_PAGE_SIZE, SMALL_SCREEN_PAGE_SIZE } from '@proton/meet/constants';
import { useMeetDispatch, useMeetSelector } from '@proton/meet/store/hooks';
import { selectIsScreenShare } from '@proton/meet/store/slices/screenShareStatusSlice';
import { selectPage, selectPageCount, setPage, setPageSize } from '@proton/meet/store/slices/sortedParticipantsSlice';

import { useIsLargerThanMd } from './useIsLargerThanMd';
import { useIsNarrowHeight } from './useIsNarrowHeight';

export const usePaginationSizeUpdates = () => {
    const dispatch = useMeetDispatch();
    const page = useMeetSelector(selectPage);
    const pageCount = useMeetSelector(selectPageCount);

    const isScreenShare = useMeetSelector(selectIsScreenShare);

    const isLargerThanMd = useIsLargerThanMd();

    const isNarrowHeight = useIsNarrowHeight();

    const sizeBasedPageSize = isLargerThanMd && !isNarrowHeight ? PAGE_SIZE : SMALL_SCREEN_PAGE_SIZE;

    const newPageSize = isScreenShare ? SCREEN_SHARE_PAGE_SIZE : sizeBasedPageSize;

    useEffect(() => {
        if (pageCount - 1 < page) {
            dispatch(setPage(Math.max(0, pageCount - 1)));
        }
    }, [dispatch, pageCount, page]);

    useEffect(() => {
        dispatch(setPageSize(newPageSize));
    }, [dispatch, newPageSize]);
};
