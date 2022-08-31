import { useDispatch } from 'react-redux';

import { useSubscribeEventManager } from '@proton/components';

import { event } from '../../logic/incomingDefaults/incomingDefaultsActions';
import { Event } from '../../models/event';

export default () => {
    const dispatch = useDispatch();

    useSubscribeEventManager(async ({ IncomingDefaults }: Event) => {
        if (!Array.isArray(IncomingDefaults)) {
            return;
        }

        for (const IncomingDefaultEvent of IncomingDefaults) {
            dispatch(event(IncomingDefaultEvent));
        }
    });
};
