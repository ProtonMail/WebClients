import { c } from 'ttag';

import { useEntitlementChecksForOrgAndUser } from '@proton/account/entitlementCatalog/hooks';
import { useCanUpdateBilling } from '@proton/account/userPermissions/hooks';
import { useConfig } from '@proton/app-context/useConfig';
import { IcUpgrade } from '@proton/icons/icons/IcUpgrade';
import { SUBSCRIPTION_STEPS } from '@proton/payments/core/subscription/subscription-modal-constants';
import { DARK_WEB_MONITORING_NAME, MAIL_UPSELL_PATHS, UPSELL_COMPONENT } from '@proton/shared/lib/constants';
import { getUpsellRefFromApp } from '@proton/shared/lib/helpers/ref';
import { Audience } from '@proton/shared/lib/interfaces/Subscription';

import PromotionButton from '../../components/button/PromotionButton/PromotionButton';
import ContactAdminUpsell from '../../components/upsell/ContactAdminUpsell';
import SettingsParagraph from '../account/SettingsParagraph';
import { useSubscriptionModal } from '../payments/subscription/subscriptionModalContext';

const DWMUpgrade = () => {
    const [canUpdateBilling] = useCanUpdateBilling();
    const [entitlements] = useEntitlementChecksForOrgAndUser();
    const { APP_NAME } = useConfig();
    const [openSubscriptionModal, loadingSubscriptionModal] = useSubscriptionModal();

    // Users who can't update billing (e.g. organization members) can't buy it themselves
    if (!canUpdateBilling) {
        return <ContactAdminUpsell className="mb-6" />;
    }

    const handleUpgrade = () => {
        void openSubscriptionModal({
            step: SUBSCRIPTION_STEPS.PLAN_SELECTION,
            mode: 'upsell-modal',
            defaultAudience: entitlements.isB2B ? Audience.B2B : Audience.B2C,
            upsellRef: getUpsellRefFromApp({
                app: APP_NAME,
                feature: MAIL_UPSELL_PATHS.DARK_WEB_MONITORING,
                component: UPSELL_COMPONENT.BUTTON,
            }),
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
                {c('dark_web_monitoring: Action').t`Upgrade to enable ${DARK_WEB_MONITORING_NAME}`}
            </PromotionButton>
        </SettingsParagraph>
    );
};

export default DWMUpgrade;
