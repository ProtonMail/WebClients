import { useState } from 'react';

import { c } from 'ttag';

import { TopBarReferralSpotlight } from '@proton/components/containers/referral/components/TopBarReferralSpotlight/TopBarReferralSpotlight';
import { useReferralDiscover } from '@proton/components/containers/referral/hooks/useReferralDiscover';

import { PromotionButton } from '../button/PromotionButton';

const TopNavReferralButton = () => {
    const { canShowTopBarButton, onTopBarSpotlightDismiss } = useReferralDiscover();

    const [showTopBarSpotlight, setShowTopBarSpotlight] = useState(false);

    if (!canShowTopBarButton) {
        return null;
    }

    return (
        <TopBarReferralSpotlight
            show={showTopBarSpotlight}
            onClose={() => setShowTopBarSpotlight(false)}
            onDismiss={() => {
                setShowTopBarSpotlight(false);
                onTopBarSpotlightDismiss();
            }}
        >
            <PromotionButton
                style={{ '--upgrade-color-stop-1': '#6243E5', '--upgrade-color-stop-2': '#D783FF' }}
                iconName="money-bills"
                onClick={() => setShowTopBarSpotlight(!showTopBarSpotlight)}
                responsive
            >
                {c('Referral').t`Refer friends`}
            </PromotionButton>
        </TopBarReferralSpotlight>
    );
};

export default TopNavReferralButton;
