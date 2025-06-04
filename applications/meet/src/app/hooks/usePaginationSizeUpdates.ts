import { useEffect, useRef } from 'react';

import { PAGE_SIZE, screenShareDoublePageSize, screenSharePageSize } from '../constants';
import { useMeetContext } from '../contexts/MeetContext';
import { useCurrentScreenShare } from './useCurrentScreenShare';
import { useSortedParticipants } from './useSortedParticipants';

export const usePaginationSizeUpdates = () => {
    const { setPage, pageSize, setPageSize } = useMeetContext();
    const { videoTrack } = useCurrentScreenShare();

    const { sortedParticipants } = useSortedParticipants();

    const hasScreenShare = !!videoTrack;

    const previousHasScreenShareRef = useRef(hasScreenShare);
    const previousPageSizeRef = useRef(pageSize);

    useEffect(() => {
        const screenShareSize = sortedParticipants.length > 5 ? screenShareDoublePageSize : screenSharePageSize;

        const newPageSize = hasScreenShare ? screenShareSize : PAGE_SIZE;

        if (previousHasScreenShareRef.current !== hasScreenShare) {
            setPageSize(newPageSize);
        }

        if (previousPageSizeRef.current !== newPageSize) {
            setPage(() => 0);
        }

        previousPageSizeRef.current = newPageSize;
        previousHasScreenShareRef.current = hasScreenShare;
    }, [hasScreenShare, setPageSize, setPage]);
};
