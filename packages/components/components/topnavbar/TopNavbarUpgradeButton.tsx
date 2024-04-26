import { useLocation } from 'react-router-dom';

import { c } from 'ttag';

import { ButtonLike } from '@proton/atoms/Button';
import {
    SUBSCRIPTION_STEPS,
    useActiveBreakpoint,
    useConfig,
    useSettingsLink,
    useSubscription,
    useUpsellConfig,
    useUser,
} from '@proton/components';
import { freeTrialUpgradeClick, redirectToAccountApp } from '@proton/components/containers/desktop/openExternalLink';
import { APP_NAMES, SHARED_UPSELL_PATHS, UPSELL_COMPONENT } from '@proton/shared/lib/constants';
import { hasInboxDesktopFeature } from '@proton/shared/lib/desktop/ipcHelpers';
import { isElectronApp } from '@proton/shared/lib/helpers/desktop';
import { isTrial } from '@proton/shared/lib/helpers/subscription';
import { getUpgradePath, getUpsellRefFromApp } from '@proton/shared/lib/helpers/upsell';

import PromotionButton from '../button/PromotionButton/PromotionButton';
import TopNavbarListItem from './TopNavbarListItem';

interface Props {
    app?: APP_NAMES;
}

const TopNavbarUpgradeButton = ({ app }: Props) => {
    const [user] = useUser();
    const [subscription] = useSubscription();
    const location = useLocation();
    const { APP_NAME } = useConfig();
    const goToSettings = useSettingsLink();

    const upgradePathname = getUpgradePath({ user, subscription, app: APP_NAME });

    const { viewportWidth } = useActiveBreakpoint();

    const upsellRef = getUpsellRefFromApp({
        app: APP_NAME,
        feature: SHARED_UPSELL_PATHS.TOP_NAVIGATION_BAR,
        component: UPSELL_COMPONENT.BUTTON,
        fromApp: app,
    });

    // We want to have metrics from where the user has clicked on the upgrade button
    const displayUpgradeButton = (user.isFree || isTrial(subscription)) && !location.pathname.endsWith(upgradePathname);
    const upgradeText = c('specialoffer: Link').t`Upgrade`;
    const upgradeIcon = upgradeText.length > 20 && viewportWidth['>=large'] ? undefined : 'upgrade';
    const upsellConfig = useUpsellConfig({ upsellRef, step: SUBSCRIPTION_STEPS.PLAN_SELECTION });

    if (displayUpgradeButton) {
        return (
            <TopNavbarListItem noCollapse>
                <PromotionButton
                    as={ButtonLike}
                    onClick={() => {
                        if (isElectronApp && !hasInboxDesktopFeature('InAppPayments')) {
                            if (upsellRef) {
                                freeTrialUpgradeClick(upsellRef);
                            } else {
                                redirectToAccountApp();
                            }
                        } else if (upsellConfig.onUpgrade) {
                            upsellConfig.onUpgrade();
                            return;
                        }

                        goToSettings(upsellConfig.upgradePath);
                    }}
                    iconName={upgradeIcon}
                    size={upgradeText.length > 14 ? 'small' : 'medium'}
                    title={c('specialoffer: Link').t`Go to subscription plans`}
                    data-testid="cta:upgrade-plan"
                    responsive
                >
                    {upgradeText}
                </PromotionButton>
            </TopNavbarListItem>
        );
    }

    return null;
};

export default TopNavbarUpgradeButton;
