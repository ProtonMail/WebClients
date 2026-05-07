import { useEffect } from 'react';

import { baseUseDispatch } from '@proton/react-redux-store';

import { safetyReviewListenerStarted, safetyReviewListenerStopped } from './listenerActions';

export const useSafetyReviewPageLoadTelemetry = () => {
    const dispatch = baseUseDispatch();

    useEffect(() => {
        dispatch(safetyReviewListenerStarted({ href: window.location.href }));
        return () => {
            dispatch(safetyReviewListenerStopped());
        };
    }, []);
};
