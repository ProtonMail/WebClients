import { useFeatures } from '@proton/components/hooks';

import { FeatureCode } from '../../features';
import { OfferConfig, OfferId, Operation, OperationsMap } from '../interface';
import { blackFridayMail2022Config, useBlackFridayMail2022 } from '../operations/blackFridayMail2022';
import { blackFridayMailFree2022Config, useBlackFridayMailFree2022 } from '../operations/blackFridayMailFree2022';
import { blackFridayMailPro2022Config, useBlackFridayMailPro2022 } from '../operations/blackFridayMailPro2022';
import { blackFridayVPN1Deal2022Config, useBlackFridayVPN1Deal2022 } from '../operations/blackFridayVPN1Deal2022';
import { blackFridayVPN2Deal2022Config, useBlackFridayVPN2Deal2022 } from '../operations/blackFridayVPN2Deal2022';
import { blackFridayVPN3Deal2022Config, useBlackFridayVPN3Deal2022 } from '../operations/blackFridayVPN3Deal2022';
import { goUnlimited2022Config, useGoUnlimited2022 } from '../operations/goUnlimited2022';
import { mailTrial2023Config, useMailTrial2023 } from '../operations/mailTrial2023';
import { specialOffer2022Config, useSpecialOffer2022 } from '../operations/specialOffer2022';

const configs: Record<OfferId, OfferConfig> = {
    'go-unlimited-2022': goUnlimited2022Config,
    'special-offer-2022': specialOffer2022Config,
    'black-friday-mail-free-2022': blackFridayMailFree2022Config,
    'black-friday-mail-2022': blackFridayMail2022Config,
    'black-friday-mail-pro-2022': blackFridayMailPro2022Config,
    'black-friday-vpn-1-deal-2022': blackFridayVPN1Deal2022Config,
    'black-friday-vpn-2-deal-2022': blackFridayVPN2Deal2022Config,
    'black-friday-vpn-3-deal-2022': blackFridayVPN3Deal2022Config,
    'mail-trial-2023': mailTrial2023Config,
};

const OFFERS_FEATURE_FLAGS = Object.values(configs).map(({ featureCode }) => featureCode);

const useOfferConfig = (): [OfferConfig | undefined, boolean] => {
    // Preload FF to avoid single API requests
    useFeatures([FeatureCode.Offers, ...OFFERS_FEATURE_FLAGS]);

    const goUnlimited2022 = useGoUnlimited2022();
    const specialOffer2022 = useSpecialOffer2022();
    const blackFridayMailFree2022 = useBlackFridayMailFree2022();
    const blackFridayMail2022 = useBlackFridayMail2022();
    const blackFridayMailPro2022 = useBlackFridayMailPro2022();
    const blackFridayVPN1Deal2022 = useBlackFridayVPN1Deal2022();
    const blackFridayVPN2Deal2022 = useBlackFridayVPN2Deal2022();
    const blackFridayVPN3Deal2022 = useBlackFridayVPN3Deal2022();
    const mailTrial2023 = useMailTrial2023();

    const operations: OperationsMap = {
        'black-friday-mail-free-2022': blackFridayMailFree2022,
        'black-friday-mail-2022': blackFridayMail2022,
        'black-friday-mail-pro-2022': blackFridayMailPro2022,
        'black-friday-vpn-1-deal-2022': blackFridayVPN1Deal2022,
        'black-friday-vpn-2-deal-2022': blackFridayVPN2Deal2022,
        'black-friday-vpn-3-deal-2022': blackFridayVPN3Deal2022,
        'go-unlimited-2022': goUnlimited2022,
        'special-offer-2022': specialOffer2022,
        'mail-trial-2023': mailTrial2023,
    };

    const allOffers = Object.values(operations);

    const validOffer: Operation | undefined = allOffers.find((offer) => !offer.isLoading && offer.isValid);
    const isLoading = allOffers.some((offer) => offer.isLoading);

    return [validOffer?.config, isLoading];
};

export default useOfferConfig;
