import { useLocation } from 'react-router-dom';

import { c } from 'ttag';

import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import { useUserSettings } from '@proton/account/userSettings/hooks';
import { useConfig } from '@proton/app-context/useConfig';
import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import { useTrialInfo } from '@proton/payments/ui/hooks/useTrialInfo';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { APPS, SHARED_UPSELL_PATHS, UPSELL_COMPONENT } from '@proton/shared/lib/constants';
import { isElectronApp } from '@proton/shared/lib/helpers/desktop';
import { getUpgradePath, getUpsellRefFromApp } from '@proton/shared/lib/helpers/upsell';

import { freeTrialUpgradeClick } from '../../containers/desktop/openExternalLink';
import { useHasInboxDesktopInAppPayments } from '../../containers/desktop/useHasInboxDesktopInAppPayments';
import { useRedirectToAccountApp } from '../../containers/desktop/useRedirectToAccountApp';
import { SUBSCRIPTION_STEPS } from '../../containers/payments/subscription/constants';
import useActiveBreakpoint from '../../hooks/useActiveBreakpoint';
import PromotionButton from '../button/PromotionButton/PromotionButton';
import useSettingsLink from '../link/useSettingsLink';
import useUpsellConfig from '../upsell/config/useUpsellConfig';
import TopNavReferralButton from './TopNavReferralButton';
import TopNavbarListItem from './TopNavbarListItem';

interface Props {
    app?: APP_NAMES;
}

const TopNavbarUpgradeButton = ({ app }: Props) => {
    const [user] = useUser();
    const [userSettings] = useUserSettings();
    const [subscription] = useSubscription();
    const { hasAtLeastOneTrial, hasReferralTrial, hasAtLeastOneB2BTrial } = useTrialInfo();
    const location = useLocation();
    const { APP_NAME } = useConfig();
    const goToSettings = useSettingsLink();

    const isUserEligibleForReferral = !!userSettings?.Referral?.Eligible;

    const upgradePathname = getUpgradePath({ user, subscription, app: APP_NAME });

    const { viewportWidth } = useActiveBreakpoint();

    const upsellRef = getUpsellRefFromApp({
        app: APP_NAME,
        feature: SHARED_UPSELL_PATHS.TOP_NAVIGATION_BAR,
        component: UPSELL_COMPONENT.BUTTON,
        fromApp: app,
    });

    // We want to have metrics from where the user has clicked on the upgrade button
    const displayUpgradeButton =
        ((user.isFree && !user.hasPassLifetime) || hasAtLeastOneTrial) &&
        !hasReferralTrial &&
        !hasAtLeastOneB2BTrial &&
        !location.pathname.endsWith(upgradePathname);
    const upgradeText = c('specialoffer: Link').t`Upgrade`;
    const upgradeIcon = upgradeText.length > 20 && viewportWidth['>=large'] ? undefined : 'upgrade';
    const upsellConfig = useUpsellConfig({
        upsellRef,
        step: SUBSCRIPTION_STEPS.PLAN_SELECTION,
    });
    const redirectToAccountApp = useRedirectToAccountApp();
    const hasInboxDesktopInAppPayments = useHasInboxDesktopInAppPayments();

    if (displayUpgradeButton) {
        return (
            <TopNavbarListItem noCollapse>
                <PromotionButton
                    as={ButtonLike}
                    onClick={() => {
                        if (isElectronApp && !hasInboxDesktopInAppPayments) {
                            if (upsellRef) {
                                freeTrialUpgradeClick(upsellRef);
                            } else {
                                redirectToAccountApp();
                            }
                        } else if (upsellConfig.onUpgrade) {
                            void upsellConfig.onUpgrade();
                        } else {
                            goToSettings(upsellConfig.upgradePath);
                        }
                    }}
                    iconName={upgradeIcon}
                    size={
                        upgradeText.length > 14 && APP_NAME === APPS.PROTONCALENDAR && !viewportWidth['<=medium']
                            ? 'small'
                            : 'medium'
                    }
                    title={c('specialoffer: Link').t`Go to subscription plans`}
                    data-testid="cta:upgrade-plan"
                    responsive
                >
                    {upgradeText}
                </PromotionButton>
            </TopNavbarListItem>
        );
    }

    if (isUserEligibleForReferral) {
        return (
            <TopNavbarListItem noCollapse>
                <TopNavReferralButton />
            </TopNavbarListItem>
        );
    }

    return null;
};

export default TopNavbarUpgradeButton;
