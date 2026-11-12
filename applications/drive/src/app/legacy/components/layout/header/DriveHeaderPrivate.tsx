import type { ReactNode } from 'react';

import { c } from 'ttag';

import useModalState from '@proton/components/components/modalTwo/useModalState';
import PrivateHeader from '@proton/components/containers/heading/PrivateHeader';
import UserDropdown from '@proton/components/containers/heading/UserDropdown';
import useActiveBreakpoint from '@proton/components/hooks/useActiveBreakpoint';
import { IcBoltFilled } from '@proton/icons/icons/IcBoltFilled';
import { OfferDealModal } from '@proton/offers-delivery/components/OfferDealModal';
import { OfferNavbarButton } from '@proton/offers-delivery/components/OfferNavbarButton';
import { useActiveOffer } from '@proton/offers-delivery/components/useActiveOffer';
import { CampaignVariant } from '@proton/offers-delivery/interface';
import { APPS } from '@proton/shared/lib/constants';

import { useOfferUpgrade } from '../../../../modules/offers/useOfferUpgrade';
import { SearchField } from '../../../../sections/search/searchField';
import isSearchFeatureEnabled from '../../../../utils/isSearchFeatureEnabled';
import { DownloadAppButton } from './DownloadAppButton';
import { SuggestBusinessButton } from './SuggestBusinessButton';

interface Props {
    isHeaderExpanded: boolean;
    toggleHeaderExpanded: () => void;
    searchBox?: ReactNode;
    title?: string;
    settingsButton?: ReactNode;
    upsellButton?: ReactNode;
}

const OptionalSearchField = () => {
    const isSearchSupported = isSearchFeatureEnabled();

    if (!isSearchSupported) {
        return null;
    }

    return <SearchField />;
};

export const DriveHeaderPrivate = ({
    isHeaderExpanded,
    toggleHeaderExpanded,
    title = c('Title').t`Drive`,
    settingsButton,
}: Props) => {
    const { viewportWidth } = useActiveBreakpoint();
    const suggestBusinessButton = SuggestBusinessButton();

    // TODO: placeholder until the campaign upsell path is decided. Might be more complicated involving plans etc
    const onUpgrade = useOfferUpgrade('upsell_drive-button-offers-delivery-placeholder');
    const offer = useActiveOffer(CampaignVariant.MODAL, { onUpgrade });
    const [offerModalProps, setOfferModalOpen, renderOfferModal] = useModalState();

    const offerButton = offer ? (
        <OfferNavbarButton
            offer={offer}
            onClick={() => setOfferModalOpen(true)}
            icon={<IcBoltFilled size={5} />}
            backgroundColor="linear-gradient(to right, #fa5c37 0%, #392289 55.288%, #170a31 100%)"
            color="white"
            className="text-uppercase text-bold"
            label={c('Action').t`Special Offer`}
        />
    ) : undefined;

    return (
        <>
            <PrivateHeader
                app={APPS.PROTONDRIVE}
                userDropdown={<UserDropdown app={APPS.PROTONDRIVE} />}
                title={title}
                expanded={isHeaderExpanded}
                onToggleExpand={toggleHeaderExpanded}
                isSmallViewport={viewportWidth['<=small']}
                actionArea={<OptionalSearchField />}
                settingsButton={settingsButton}
                upsellButton={offerButton ?? suggestBusinessButton}
                downloadAppButton={<DownloadAppButton />}
            />
            {renderOfferModal && offer && <OfferDealModal offer={offer} {...offerModalProps} />}
        </>
    );
};
