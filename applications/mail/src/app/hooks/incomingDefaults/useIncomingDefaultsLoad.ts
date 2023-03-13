import { useEffect } from 'react';

import { useApi } from '@proton/components/hooks';

import { load as loadIncomingDefaults } from '../../logic/incomingDefaults/incomingDefaultsActions';
import { useAppDispatch } from '../../logic/store';
import { useIncomingDefaultsStatus } from './useIncomingDefaults';

export default () => {
    const api = useApi();
    const dispatch = useAppDispatch();
    const incomingDefaultsStatus = useIncomingDefaultsStatus();

    useEffect(() => {
        if (incomingDefaultsStatus === 'not-loaded') {
            dispatch(loadIncomingDefaults({ api }));
        }
    }, []);
};
