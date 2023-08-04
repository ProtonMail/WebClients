import { useFeature } from '../../hooks';
import { FeatureCode } from '../features';

export default () => {
    const feature = useFeature(FeatureCode.VpnB2bPlans);

    return [!!feature?.feature, feature.loading];
};
