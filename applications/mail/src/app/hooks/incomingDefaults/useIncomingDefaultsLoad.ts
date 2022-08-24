import { useEffect } from 'react';
import { useDispatch } from 'react-redux';

import { FeatureCode } from '@proton/components/containers';
import { useApi, useFeature } from '@proton/components/hooks';

import { load as loadIncomingDefaults } from '../../logic/incomingDefaults/incomingDefaultsActions';
import { useIncomingDefaultsStatus } from './useIncomingDefaults';

export default () => {
    const { feature: blockSenderFeature, loading: blockSenderLoading } = useFeature(FeatureCode.BlockSender);
    const api = useApi();
    const dispatch = useDispatch();
    const incomingDefaultsStatus = useIncomingDefaultsStatus();

    useEffect(() => {
        if (
            blockSenderLoading === false &&
            blockSenderFeature?.Value === true &&
            incomingDefaultsStatus === 'not-loaded'
        ) {
            dispatch(loadIncomingDefaults({ api }));
        }
    }, [blockSenderLoading, blockSenderFeature?.Value]);
};
