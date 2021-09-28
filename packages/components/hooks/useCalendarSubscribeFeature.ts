import { getResult } from '@proton/shared/lib/environment/helper';
import { FeatureCode } from '../containers/features';
import useFeature from './useFeature';
import useEarlyAccess from './useEarlyAccess';

const useCalendarSubscribeFeature = () => {
    const { currentEnvironment } = useEarlyAccess();
    const value = useFeature(FeatureCode.CalendarSubscription)?.feature?.Value;
    return getResult(value, currentEnvironment, ['enabled', 'unavailable']);
};

export default useCalendarSubscribeFeature;
