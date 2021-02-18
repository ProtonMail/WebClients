import useFeature from './useFeature';
import { FeatureCode } from '../containers/features';

const useEarlyAccess = () => {
    const { feature: { Value: maybeEarlyAccess, DefaultValue } = {} } = useFeature(FeatureCode.EarlyAccess);

    const earlyAccess = maybeEarlyAccess || DefaultValue;

    const hasEarlyAccess = earlyAccess === 'alpha' || earlyAccess === 'beta';

    const hasAlphaAccess = earlyAccess === 'alpha';

    return { hasEarlyAccess, hasAlphaAccess };
};

export default useEarlyAccess;
