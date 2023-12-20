import { useEffect } from 'react';

import { useMailDispatch } from 'proton-mail/store/hooks';

import { load as loadIncomingDefaults } from '../../store/incomingDefaults/incomingDefaultsActions';
import { useIncomingDefaultsStatus } from './useIncomingDefaults';

export default () => {
    const dispatch = useMailDispatch();
    const incomingDefaultsStatus = useIncomingDefaultsStatus();

    useEffect(() => {
        if (incomingDefaultsStatus === 'not-loaded') {
            void dispatch(loadIncomingDefaults());
        }
    }, []);
};
