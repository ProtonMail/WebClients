import { ExperimentCode } from '@proton/components/containers/experiments';
import { useConfig, useExperiment, useSubscription, useUser } from '@proton/components/hooks';

import useOfferFlags from '../../hooks/useOfferFlags';
import { Operation } from '../../interface';
import config from './configuration';
import isEligible from './eligibility';

const useOffer = (): Operation => {
    const protonConfig = useConfig();
    const [user, userLoading] = useUser();
    const [subscription, loading] = useSubscription();
    const { isActive, loading: flagsLoading } = useOfferFlags(config);
    const { value: experimentValue, loading: loadingExperiment } = useExperiment(ExperimentCode.Family2023);

    const isLoading = flagsLoading || loadingExperiment || userLoading || loading;
    const isUserEligible = isEligible({ user, subscription, protonConfig });
    const isValid = isUserEligible && isActive && experimentValue === 'A';

    return { isValid, config, isLoading };
};

export default useOffer;
