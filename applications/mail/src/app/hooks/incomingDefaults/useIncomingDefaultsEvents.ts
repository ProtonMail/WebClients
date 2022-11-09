import { useSubscribeEventManager } from '@proton/components';

import { event } from '../../logic/incomingDefaults/incomingDefaultsActions';
import { useAppDispatch } from '../../logic/store';
import { Event } from '../../models/event';

export default () => {
    const dispatch = useAppDispatch();

    useSubscribeEventManager(async ({ IncomingDefaults }: Event) => {
        if (!Array.isArray(IncomingDefaults)) {
            return;
        }

        for (const IncomingDefaultEvent of IncomingDefaults) {
            dispatch(event(IncomingDefaultEvent));
        }
    });
};
