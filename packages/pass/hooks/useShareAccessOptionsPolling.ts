import { useEffect, useRef, useState } from 'react';

import usePrevious from '@proton/hooks/usePrevious';
import { ACTIVE_POLLING_TIMEOUT } from '@proton/pass/lib/events/constants';
import { getShareAccessOptions } from '@proton/pass/store/actions';
import { type Maybe } from '@proton/pass/types';

import { useRequest } from './useActionRequest';

export const useShareAccessOptionsPolling = (shareId: string) => {
    const timer = useRef<Maybe<ReturnType<typeof setTimeout>>>();
    const { loading, dispatch, revalidate } = useRequest(getShareAccessOptions, { initial: { shareId } });

    const wasLoading = usePrevious(loading);
    const [didLoad, setDidLoad] = useState(false);

    useEffect(() => {
        timer.current = setInterval(() => dispatch({ shareId }), ACTIVE_POLLING_TIMEOUT);
        revalidate({ shareId });

        return () => clearInterval(timer.current);
    }, [shareId]);

    useEffect(() => {
        if (wasLoading === true && !loading) setDidLoad(true);
    }, [loading]);

    return didLoad ? false : loading;
};
