import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import { PromotionButton } from '@proton/components/components/button/PromotionButton';
import SettingsParagraph from '@proton/components/containers/account/SettingsParagraph';
import { useSubscriptionModal } from '@proton/components/containers/payments/subscription/SubscriptionModalProvider';
import { SUBSCRIPTION_STEPS } from '@proton/components/containers/payments/subscription/constants';
import useConfig from '@proton/components/hooks/useConfig';
import {
    type APP_NAMES,
    PROTON_SENTINEL_NAME,
    SHARED_UPSELL_PATHS,
    UPSELL_COMPONENT,
} from '@proton/shared/lib/constants';
import { getUpsellRefFromApp } from '@proton/shared/lib/helpers/upsell';
import { Audience } from '@proton/shared/lib/interfaces/Subscription';

interface Props {
    app: APP_NAMES;
    variant: 'user' | 'organization';
}

const SentinelUpgradeButton = ({ app, variant }: Props) => {
    const [user] = useUser();
    const { APP_NAME } = useConfig();
    const [openSubscriptionModal, loadingSubscriptionModal] = useSubscriptionModal();

    if (!user.canPay) {
        return null;
    }

    const handleUpgrade = () => {
        const upsellRef = getUpsellRefFromApp({
            app: APP_NAME,
            feature: variant === 'user' ? SHARED_UPSELL_PATHS.SENTINEL : SHARED_UPSELL_PATHS.SENTINEL_B2B,
            component: UPSELL_COMPONENT.BUTTON,
            fromApp: app,
        });
        openSubscriptionModal({
            step: SUBSCRIPTION_STEPS.PLAN_SELECTION,
            metrics: {
                source: 'upsells',
            },
            mode: 'upsell-modal',
            defaultAudience: variant === 'user' ? Audience.B2C : Audience.B2B,
            upsellRef,
        });
    };

    return (
        <SettingsParagraph>
            <PromotionButton
                iconName="upgrade"
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
