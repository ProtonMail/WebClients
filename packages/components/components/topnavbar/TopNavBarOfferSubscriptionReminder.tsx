import { useRef } from 'react';

import useOfferFlags from '@proton/components/containers/offers/hooks/useOfferFlags';
import useVisitedOffer from '@proton/components/containers/offers/hooks/useVisitedOffer';
import type { Offer, OfferConfig } from '@proton/components/containers/offers/interface';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import type { Currency } from '@proton/shared/lib/interfaces';
import noop from '@proton/utils/noop';

import type { ModalProps } from '../modalTwo';
import { Spotlight, useSpotlightShow } from '../spotlight';
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
    const show = useSpotlightShow(!!open, 3000);

    return (
        <Spotlight
            anchorRef={buttonRef}
            innerClassName="p-6 pt-12"
            hasClose={false}
            show={show}
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
