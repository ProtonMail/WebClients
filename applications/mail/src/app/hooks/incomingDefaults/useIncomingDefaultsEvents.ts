import { useSubscribeEventManager } from '@proton/components';

import { useMailDispatch } from 'proton-mail/store/hooks';

import type { Event } from '../../models/event';
import { event } from '../../store/incomingDefaults/incomingDefaultsActions';

export default () => {
    const dispatch = useMailDispatch();

    useSubscribeEventManager(async ({ IncomingDefaults }: Event) => {
        if (!Array.isArray(IncomingDefaults)) {
            return;
        }

        for (const IncomingDefaultEvent of IncomingDefaults) {
            dispatch(event(IncomingDefaultEvent));
        }
    });
};
