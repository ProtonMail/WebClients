import { getResult } from '@proton/shared/lib/environment/helper';

import { FeatureCode } from '../containers/features';
import useEarlyAccess from './useEarlyAccess';
import useFeature from './useFeature';

const useCalendarSubscribeFeature = () => {
    const { currentEnvironment } = useEarlyAccess();
    const value = useFeature(FeatureCode.CalendarSubscription)?.feature?.Value;
    return getResult(value, currentEnvironment, ['enabled', 'unavailable']);
};

export default useCalendarSubscribeFeature;
