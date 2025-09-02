import { useEffect, useRef, useState } from 'react';

import usePrevious from '@proton/hooks/usePrevious';
import { ACTIVE_POLLING_TIMEOUT } from '@proton/pass/lib/events/constants';
import { getShareAccessOptions } from '@proton/pass/store/actions';
import type { Maybe } from '@proton/pass/types';

import { useRequest } from './useRequest';

export const useShareAccessOptionsPolling = (shareId: string, itemId?: string) => {
    const timer = useRef<Maybe<ReturnType<typeof setTimeout>>>();
    const { loading, dispatch, revalidate } = useRequest(getShareAccessOptions, { initial: { shareId, itemId } });

    const wasLoading = usePrevious(loading);
    const [didLoad, setDidLoad] = useState(false);

    useEffect(() => {
        timer.current = setInterval(() => dispatch({ shareId, itemId }), ACTIVE_POLLING_TIMEOUT);
        revalidate({ shareId, itemId });

        return () => clearInterval(timer.current);
    }, [shareId, itemId]);

    useEffect(() => {
        if (wasLoading === true && !loading) setDidLoad(true);
    }, [loading]);

    return didLoad ? false : loading;
};
