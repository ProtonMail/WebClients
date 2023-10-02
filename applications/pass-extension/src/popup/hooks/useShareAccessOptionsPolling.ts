import { useEffect, useRef } from 'react';

import { ACTIVE_POLLING_TIMEOUT } from '@proton/pass/events/constants';
import { getShareAccessOptionsIntent } from '@proton/pass/store';
import { shareAccessOptionsRequest } from '@proton/pass/store/actions/requests';

import { useActionWithRequest } from '../../shared/hooks/useActionWithRequest';

export const useShareAccessOptionsPolling = (shareId: string) => {
    const timer = useRef<NodeJS.Timer>();

    const getShareAccessOptions = useActionWithRequest({
        action: getShareAccessOptionsIntent,
        requestId: shareAccessOptionsRequest(shareId),
    });

    useEffect(() => {
        timer.current = setInterval(() => getShareAccessOptions.dispatch(shareId), ACTIVE_POLLING_TIMEOUT);
        getShareAccessOptions.revalidate(shareId);

        return () => clearInterval(timer.current);
    }, [shareId]);

    return getShareAccessOptions.loading;
};
