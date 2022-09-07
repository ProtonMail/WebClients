import { useEffect } from 'react';

import { c } from 'ttag';

import { Icon, useModalState } from '@proton/components';
import useOfferFlags from '@proton/components/containers/offers/hooks/useOfferFlags';
import { OfferConfig } from '@proton/components/containers/offers/interface';

import { OfferModal } from '../../containers';
import TopNavbarListItem from './TopNavbarListItem';
import TopNavbarListItemButton from './TopNavbarListItemButton';

interface Props {
    offerConfig: OfferConfig;
}

const TopNavbarOffer = ({ offerConfig }: Props) => {
    const [offerModalProps, setOfferModalOpen, renderOfferModal] = useModalState();
    const { isVisited, loading } = useOfferFlags(offerConfig);

    useEffect(() => {
        if (!loading && offerConfig.autoPopUp && !isVisited) {
            setOfferModalOpen(true);
        }
    }, [loading]);

    return (
        <>
            <TopNavbarListItem noShrink>
                <TopNavbarListItemButton
                    as="button"
                    type="button"
                    icon={<Icon name="bag-percent" />}
                    text={offerConfig.getCTAContent?.() || c('specialoffer: Action').t`Special Offer`}
                    onClick={() => setOfferModalOpen(true)}
                />
            </TopNavbarListItem>
            {renderOfferModal && <OfferModal offerConfig={offerConfig} modalProps={offerModalProps} />}
        </>
    );
};

export default TopNavbarOffer;
