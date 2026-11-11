import { c } from 'ttag';

import { useCanUpdateBilling } from '@proton/account/userPermissions/hooks';
import { useConfig } from '@proton/app-context/useConfig';
import { IcUpgrade } from '@proton/icons/icons/IcUpgrade';
import { SUBSCRIPTION_STEPS } from '@proton/payments/core/subscription/subscription-modal-constants';
import {
    type APP_NAMES,
    PROTON_SENTINEL_NAME,
    SHARED_UPSELL_PATHS,
    UPSELL_COMPONENT,
} from '@proton/shared/lib/constants';
import { getUpsellRefFromApp } from '@proton/shared/lib/helpers/ref';
import { Audience } from '@proton/shared/lib/interfaces/Subscription';

import PromotionButton from '../../components/button/PromotionButton/PromotionButton';
import SettingsParagraph from '../account/SettingsParagraph';
import { useSubscriptionModal } from '../payments/subscription/subscriptionModalContext';

interface Props {
    app: APP_NAMES;
    variant: 'user' | 'organization';
}

const SentinelUpgradeButton = ({ app, variant }: Props) => {
    const [canUpdateBilling] = useCanUpdateBilling();
    const { APP_NAME } = useConfig();
    const [openSubscriptionModal, loadingSubscriptionModal] = useSubscriptionModal();

    if (!canUpdateBilling) {
        return null;
    }

    const handleUpgrade = () => {
        const upsellRef = getUpsellRefFromApp({
            app: APP_NAME,
            feature: variant === 'user' ? SHARED_UPSELL_PATHS.SENTINEL : SHARED_UPSELL_PATHS.SENTINEL_B2B,
            component: UPSELL_COMPONENT.BUTTON,
            fromApp: app,
        });
        void openSubscriptionModal({
            step: SUBSCRIPTION_STEPS.PLAN_SELECTION,
            mode: 'upsell-modal',
            defaultAudience: variant === 'user' ? Audience.B2C : Audience.B2B,
            upsellRef,
        });
    };

    return (
        <SettingsParagraph>
            <PromotionButton
                iconComponent={IcUpgrade}
                iconGradient={true}
                onClick={handleUpgrade}
                disabled={loadingSubscriptionModal}
            >
                {c('Action').t`Upgrade to enable ${PROTON_SENTINEL_NAME}`}
            </PromotionButton>
        </SettingsParagraph>
    );
};

export default SentinelUpgradeButton;
