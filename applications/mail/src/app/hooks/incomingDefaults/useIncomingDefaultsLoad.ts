import { useEffect } from 'react';
import { useDispatch } from 'react-redux';

import { useApi } from '@proton/components/hooks';

import { load as loadIncomingDefaults } from '../../logic/incomingDefaults/incomingDefaultsActions';
import { useIncomingDefaultsStatus } from './useIncomingDefaults';

export default () => {
    const api = useApi();
    const dispatch = useDispatch();
    const incomingDefaultsStatus = useIncomingDefaultsStatus();

    useEffect(() => {
        if (incomingDefaultsStatus === 'not-loaded') {
            dispatch(loadIncomingDefaults({ api }));
        }
    }, []);
};
