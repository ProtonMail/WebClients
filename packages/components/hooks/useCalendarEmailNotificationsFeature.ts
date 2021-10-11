import { getResult } from '@proton/shared/lib/environment/helper';
import { FeatureCode } from '../containers/features';
import useFeature from './useFeature';
import useEarlyAccess from './useEarlyAccess';

const useCalendarEmailNotificationsFeature = () => {
    const { currentEnvironment } = useEarlyAccess();
    const value = useFeature(FeatureCode.CalendarEmailNotification)?.feature?.Value;
    return getResult(value, currentEnvironment, ['enabled']).enabled;
};

export default useCalendarEmailNotificationsFeature;
