import { useEffect } from 'react';

import { useEventManager } from '@proton/components';

import { useMailDispatch } from 'proton-mail/store/hooks';

import { event } from '../../store/incomingDefaults/incomingDefaultsActions';

export default () => {
    const dispatch = useMailDispatch();
    const { subscribe } = useEventManager();

    useEffect(() => {
        const unsubscribe = subscribe(({ IncomingDefaults }) => {
            if (!Array.isArray(IncomingDefaults)) {
                return;
            }

            dispatch(event(IncomingDefaults));
        });

        return () => {
            unsubscribe?.();
        };
    }, []);
};
