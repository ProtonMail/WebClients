import { FeatureCode, FeatureContextValue } from '../containers';
import useFeatures from './useFeatures';

const useFeature = <FeatureValue = any>(code: FeatureCode, prefetch = true) => {
    // Forcing type, not sure how to type a generic array
    const { featuresFlags } = useFeatures([code], prefetch);
    return featuresFlags[0] as FeatureContextValue<FeatureValue>;
};

export default useFeature;
