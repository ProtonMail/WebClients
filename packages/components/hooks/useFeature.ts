import { FeatureCode } from '../containers/features';
import useFeatures from './useFeatures';

const useFeature = (code: FeatureCode, prefetch = true) => {
    return useFeatures([code], prefetch)[0];
};

export default useFeature;
