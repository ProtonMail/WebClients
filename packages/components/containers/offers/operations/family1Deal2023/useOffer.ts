import { ExperimentCode } from '@proton/components/containers/experiments';
import { FeatureCode } from '@proton/components/containers/features';
import { useConfig, useExperiment, useFeature, useSubscription, useUser } from '@proton/components/hooks';

import useOfferFlags from '../../hooks/useOfferFlags';
import { OfferUserFeatureCodeValue, Operation } from '../../interface';
import config from './configuration';
import isEligible from './eligibility';

const useOffer = (): Operation => {
    const protonConfig = useConfig();
    const [user, userLoading] = useUser();
    const [subscription, loading] = useSubscription();
    const { feature, loading: loadingFeature } = useFeature(FeatureCode.OfferFamily2023);
    const { isActive, loading: flagsLoading } = useOfferFlags(config);
    const { value: experimentValue, loading: loadingExperiment } = useExperiment(ExperimentCode.Family2023);

    const isLoading = flagsLoading || loadingExperiment || userLoading || loading || !!loadingFeature;
    const isUserEligible = isEligible({ user, subscription, protonConfig });
    const isValid =
        isUserEligible && isActive && feature?.Value !== OfferUserFeatureCodeValue.Hide && experimentValue === 'A';

    return { isValid, config, isLoading };
};

export default useOffer;
