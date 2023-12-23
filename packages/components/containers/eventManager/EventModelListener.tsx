import { useEffect } from 'react';

import { serverEvent } from '@proton/account';
import { useDispatch } from '@proton/redux-shared-store';

import { useEventManager } from '../../hooks';

const EventModelListener = () => {
    const { subscribe } = useEventManager();
    const dispatch = useDispatch();

    useEffect(() => {
        return subscribe((data) => {
            dispatch(serverEvent(data));
        });
    }, []);

    return <>{null}</>;
};

export default EventModelListener;
