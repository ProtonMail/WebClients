import { useRef } from 'react';

import useOfferFlags from '@proton/components/containers/offers/hooks/useOfferFlags';
import useVisitedOffer from '@proton/components/containers/offers/hooks/useVisitedOffer';
import { Offer, OfferConfig } from '@proton/components/containers/offers/interface';
import { APP_NAMES } from '@proton/shared/lib/constants';
import { Currency } from '@proton/shared/lib/interfaces';
import noop from '@proton/utils/noop';

import { ModalProps } from '../modalTwo';
import { Spotlight } from '../spotlight';
import TopNavbarUpgradeButton from './TopNavbarUpgradeButton';

interface Props {
    currency: Currency;
    offerConfig: OfferConfig;
    app: APP_NAMES;
    offer?: Offer;
    onChangeCurrency: (currency: Currency) => void;
    modalProps: ModalProps;
}

const TopNabarOfferSubscriptionReminder = ({
    currency,
    app,
    onChangeCurrency,
    offerConfig,
    offer,
    modalProps,
}: Props) => {
    useVisitedOffer(offerConfig);
    const buttonRef = useRef(null);
    const { handleVisit } = useOfferFlags(offerConfig);
    const { onClose: handleCloseModal, open } = modalProps;

    return (
        <Spotlight
            anchorRef={buttonRef}
            innerClassName="p-6 pt-12"
            hasClose={false}
            show={!!open}
            content={
                <offerConfig.layout
                    currency={currency}
                    onChangeCurrency={onChangeCurrency}
                    offer={offer}
                    onCloseModal={() => {
                        handleVisit();
                        handleCloseModal?.();
                    }}
                    onSelectDeal={noop}
                />
            }
            originalPlacement="bottom"
        >
            <div ref={buttonRef}>
                <TopNavbarUpgradeButton app={app} />
            </div>
        </Spotlight>
    );
};

export default TopNabarOfferSubscriptionReminder;
