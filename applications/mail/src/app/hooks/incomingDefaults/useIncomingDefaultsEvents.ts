import useEventManager from '@proton/components/hooks/useEventManager';
import { useEffect } from 'react';


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
        // eslint-disable-next-line react-hooks/exhaustive-deps -- autofix-eslint-7FDAAD
    }, []);
};
