import { useEffect } from 'react';

import { PAGE_SIZE, SCREEN_SHARE_PAGE_SIZE, SMALL_SCREEN_PAGE_SIZE } from '@proton/meet/constants';
import { useMeetDispatch, useMeetSelector } from '@proton/meet/store/hooks';
import { selectPage, selectPageSize, setPage, setPageSize } from '@proton/meet/store/slices/meetingState';

import { useMeetContext } from '../contexts/MeetContext';
import { useSortedParticipantsContext } from '../contexts/ParticipantsProvider/SortedParticipantsProvider';
import { useIsLargerThanMd } from './useIsLargerThanMd';
import { useIsNarrowHeight } from './useIsNarrowHeight';

export const usePaginationSizeUpdates = () => {
    const dispatch = useMeetDispatch();
    const page = useMeetSelector(selectPage);
    const pageSize = useMeetSelector(selectPageSize);
    const { sortedParticipants } = useSortedParticipantsContext();
    const { isScreenShare } = useMeetContext();

    const pageCount = Math.ceil(sortedParticipants.length / pageSize);

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
