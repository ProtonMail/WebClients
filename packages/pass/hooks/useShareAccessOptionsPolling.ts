import { useEffect, useRef, useState } from 'react';

import usePrevious from '@proton/hooks/usePrevious';
import { ACTIVE_POLLING_TIMEOUT } from '@proton/pass/lib/events/constants';
import { getShareAccessOptionsIntent } from '@proton/pass/store/actions';
import { shareAccessOptionsRequest } from '@proton/pass/store/actions/requests';
import { type Maybe } from '@proton/pass/types';

import { useActionRequest } from './useActionRequest';

export const useShareAccessOptionsPolling = (shareId: string) => {
    const timer = useRef<Maybe<ReturnType<typeof setTimeout>>>();

    const { loading, dispatch, revalidate } = useActionRequest({
        action: getShareAccessOptionsIntent,
        requestId: shareAccessOptionsRequest(shareId),
    });

    const wasLoading = usePrevious(loading);
    const [didLoad, setDidLoad] = useState(false);

    useEffect(() => {
        timer.current = setInterval(() => dispatch(shareId), ACTIVE_POLLING_TIMEOUT);
        revalidate(shareId);

        return () => clearInterval(timer.current);
    }, [shareId]);

    useEffect(() => {
        if (wasLoading === true && !loading) setDidLoad(true);
    }, [loading]);

    return didLoad ? false : loading;
};
