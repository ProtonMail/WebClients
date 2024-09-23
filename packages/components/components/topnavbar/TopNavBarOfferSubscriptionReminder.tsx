import { useRef } from 'react';

import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import Spotlight from '@proton/components/components/spotlight/Spotlight';
import useSpotlightShow from '@proton/components/components/spotlight/useSpotlightShow';
import { FeatureCode } from '@proton/components/containers/features';
import useOfferFlags from '@proton/components/containers/offers/hooks/useOfferFlags';
import type { Offer, OfferConfig } from '@proton/components/containers/offers/interface';
import useFeature from '@proton/components/hooks/useFeature';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import type { Currency } from '@proton/shared/lib/interfaces';
import noop from '@proton/utils/noop';

import TopNavbarUpgradeButton from './TopNavbarUpgradeButton';

interface Props {
    currency: Currency;
    offerConfig: OfferConfig;
    app: APP_NAMES;
    offer?: Offer;
    onChangeCurrency: (currency: Currency) => void;
    modalProps: ModalProps;
}

const TopNavbarOfferSubscriptionReminder = ({
    currency,
    app,
    onChangeCurrency,
    offerConfig,
    offer,
    modalProps,
}: Props) => {
    const buttonRef = useRef(null);
    const { handleVisit, isVisited } = useOfferFlags(offerConfig);
    const { update } = useFeature(FeatureCode.SubscriptionLastReminderDate);
    const { onClose: handleCloseModal, open } = modalProps;
    const show = useSpotlightShow(!!open, 3000);

    // We want to store the date of the last reminder to remind again in 6 months
    const handleReminderVisite = () => {
        if (!isVisited) {
            return;
        }

        void update(Math.floor(Date.now() / 1000));
    };

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
                        void handleVisit();
                        handleCloseModal?.();
                        handleReminderVisite();
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

export default TopNavbarOfferSubscriptionReminder;
