import { useEffect } from 'react';

import { load as loadIncomingDefaults } from '../../logic/incomingDefaults/incomingDefaultsActions';
import { useAppDispatch } from '../../logic/store';
import { useIncomingDefaultsStatus } from './useIncomingDefaults';

export default () => {
    const dispatch = useAppDispatch();
    const incomingDefaultsStatus = useIncomingDefaultsStatus();

    useEffect(() => {
        if (incomingDefaultsStatus === 'not-loaded') {
            void dispatch(loadIncomingDefaults());
        }
    }, []);
};
