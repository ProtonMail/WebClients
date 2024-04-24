import { useSettingsLink, useUpsellConfig } from '@proton/components/components';
import { SUBSCRIPTION_STEPS } from '@proton/components/containers/payments';
import { useFlag } from '@proton/components/containers/unleash';
import { APPS, APP_UPSELL_REF_PATH, MAIL_UPSELL_PATHS } from '@proton/shared/lib/constants';
import { getUpsellRef } from '@proton/shared/lib/helpers/upsell';

import { OfferLayoutProps } from '../../interface';
import LayoutPrivacy from './layout/LayoutPrivacy';
import LayoutProductivity from './layout/LayoutProductivity';

const Layout = (props: OfferLayoutProps) => {
    const { onCloseModal } = props;
    const goToSettings = useSettingsLink();
    const ABTestInboxUpsellStepEnabled = useFlag('ABTestInboxUpsellStep');

    const upsellRef = getUpsellRef({
        app: APP_UPSELL_REF_PATH.MAIL_UPSELL_REF_PATH,
        feature: ABTestInboxUpsellStepEnabled
            ? MAIL_UPSELL_PATHS.SUBSCRIPTION_REMINDER_PRIVACY
            : MAIL_UPSELL_PATHS.SUBSCRIPTION_REMINDER_PRODUCTIVITY,
    });

    const { upgradePath, onUpgrade } = useUpsellConfig({ upsellRef, step: SUBSCRIPTION_STEPS.PLAN_SELECTION });
    const onUpgradeClick = () => {
        if (onUpgrade) {
            onCloseModal();
            onUpgrade();
        } else {
            goToSettings(upgradePath, APPS.PROTONMAIL);
        }
    };

    return ABTestInboxUpsellStepEnabled ? (
        <LayoutPrivacy onClick={onUpgradeClick} onClose={onCloseModal} />
    ) : (
        <LayoutProductivity onClick={onUpgradeClick} onClose={onCloseModal} />
    );
};

export default Layout;
