import { useMemo } from 'react';

import { getUserByte } from '@proton/shared/lib/user/helpers';

import { FeatureCode } from '../containers';
import useFeature from './useFeature';
import useUser from './useUser';

const useProgressiveRollout = (code: FeatureCode) => {
    const [user] = useUser();
    const { feature } = useFeature(code);
    const userID = user?.ID || '';
    const userByte = useMemo(() => getUserByte(user), [userID]);
    const threshold = feature?.Value >= 0 && feature?.Value <= 100 ? feature?.Value : 0;

    return userByte < Math.floor((threshold / 100) * 255);
};

export default useProgressiveRollout;
