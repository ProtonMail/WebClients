import { useFeature } from '../../hooks';
import { FeatureCode } from '../features';

export default (): [featureEnabled: boolean, loading: boolean] => {
    const feature = useFeature<boolean>(FeatureCode.VpnB2bPlans);
    const value: boolean | undefined = feature?.feature?.Value;
    return [!!value, !!feature.loading];
};
