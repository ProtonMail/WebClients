import { useSettingsLink } from '@proton/components/components';
import useUpsellConfig from '@proton/components/components/upsell/useUpsellConfig';
import { SUBSCRIPTION_STEPS } from '@proton/components/containers/payments';
import { APPS, APP_UPSELL_REF_PATH, MAIL_UPSELL_PATHS, UPSELL_COMPONENT } from '@proton/shared/lib/constants';
import { getUpsellRef } from '@proton/shared/lib/helpers/upsell';

import type { OfferLayoutProps } from '../../interface';
import LayoutPrivacy from './layout/LayoutPrivacy';
import LayoutProductivity from './layout/LayoutProductivity';

// We don't want the value to change on each render
const versionToDisplay = Math.random() > 0.5;

const Layout = (props: OfferLayoutProps) => {
    const { onCloseModal } = props;
    const goToSettings = useSettingsLink();

    const upsellRef = getUpsellRef({
        app: APP_UPSELL_REF_PATH.MAIL_UPSELL_REF_PATH,
        component: UPSELL_COMPONENT.BANNER,
        feature: versionToDisplay
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

    return versionToDisplay ? (
        <LayoutPrivacy onClick={onUpgradeClick} onClose={onCloseModal} />
    ) : (
        <LayoutProductivity onClick={onUpgradeClick} onClose={onCloseModal} />
    );
};

export default Layout;
