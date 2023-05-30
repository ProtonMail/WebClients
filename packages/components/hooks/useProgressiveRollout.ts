import { useMemo } from 'react';

import { decodeBase64URL } from '@proton/shared/lib/helpers/encoding';

import { FeatureCode } from '../containers';
import useFeature from './useFeature';
import useUser from './useUser';

const useProgressiveRollout = (code: FeatureCode) => {
    const [user] = useUser();
    const { feature } = useFeature(code);
    const threshold = feature?.Value >= 0 && feature?.Value <= 1 ? feature?.Value : 0;
    const byte = useMemo(() => {
        const byteCharacters = decodeBase64URL(user.ID);
        return byteCharacters.charCodeAt(0);
    }, [user.ID]);

    return byte < Math.floor(threshold * 255);
};

export default useProgressiveRollout;
