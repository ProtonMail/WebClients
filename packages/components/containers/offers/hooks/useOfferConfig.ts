import { useFeatures } from '@proton/components/hooks';

import { FeatureCode } from '../../features';
import { OfferConfig, OfferId, Operation, OperationsMap } from '../interface';
import { goUnlimited2022Config, useGoUnlimited2022 } from '../operations/goUnlimited2022';
import { specialOffer2022Config, useSpecialOffer2022 } from '../operations/specialOffer2022';

const configs: Record<OfferId, OfferConfig> = {
    'go-unlimited-2022': goUnlimited2022Config,
    'special-offer-2022': specialOffer2022Config,
};

const OFFERS_FEATURE_FLAGS = Object.values(configs).map(({ featureCode }) => featureCode);

const useOfferConfig = (): OfferConfig | undefined => {
    // Preload FF to avoid single API requests
    useFeatures([FeatureCode.Offers, ...OFFERS_FEATURE_FLAGS]);

    const goUnlimited2022 = useGoUnlimited2022();
    const specialOffer2022 = useSpecialOffer2022();

    const operations: OperationsMap = {
        'go-unlimited-2022': goUnlimited2022,
        'special-offer-2022': specialOffer2022,
    };

    const validOffer: Operation | undefined = Object.values(operations).find(
        ({ isLoading, isValid }) => isLoading === false && isValid
    );

    return validOffer?.config;
};

export default useOfferConfig;
