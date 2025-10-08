import { useLocation } from 'react-router-dom';

import { c } from 'ttag';

import { useOrganization } from '@proton/account/organization/hooks';
import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import { useUserSettings } from '@proton/account/userSettings/hooks';
import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import useSettingsLink from '@proton/components/components/link/useSettingsLink';
import useUpsellConfig from '@proton/components/components/upsell/config/useUpsellConfig';
import { freeTrialUpgradeClick } from '@proton/components/containers/desktop/openExternalLink';
import { useHasInboxDesktopInAppPayments } from '@proton/components/containers/desktop/useHasInboxDesktopInAppPayments';
import { useRedirectToAccountApp } from '@proton/components/containers/desktop/useRedirectToAccountApp';
import { SUBSCRIPTION_STEPS } from '@proton/components/containers/payments/subscription/constants';
import useActiveBreakpoint from '@proton/components/hooks/useActiveBreakpoint';
import useConfig from '@proton/components/hooks/useConfig';
import { useTrialOnlyPaymentMethods } from '@proton/components/hooks/useTrialOnlyPaymentMethods';
import { isTrial } from '@proton/payments';
import { useIsB2BTrial } from '@proton/payments/ui';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { APPS, SHARED_UPSELL_PATHS, UPSELL_COMPONENT } from '@proton/shared/lib/constants';
import { isElectronApp } from '@proton/shared/lib/helpers/desktop';
import { getUpgradePath, getUpsellRefFromApp } from '@proton/shared/lib/helpers/upsell';
import useFlag from '@proton/unleash/useFlag';

import PromotionButton from '../button/PromotionButton/PromotionButton';
import TopNavReferralButton from './TopNavReferralButton';
import TopNavbarListItem from './TopNavbarListItem';

interface Props {
    app?: APP_NAMES;
}

const TopNavbarUpgradeButton = ({ app }: Props) => {
    const [user] = useUser();
    const [userSettings] = useUserSettings();
    const [subscription] = useSubscription();
    const [organization] = useOrganization();
    const isB2BTrial = useIsB2BTrial(subscription, organization);
    const location = useLocation();
    const { APP_NAME } = useConfig();
    const goToSettings = useSettingsLink();

    const isReferralExpansionEnabled = useFlag('ReferralExpansion');
    const isUserEligibleForReferral = !!userSettings?.Referral?.Eligible;
    const hasTrialPaymentMethods = useTrialOnlyPaymentMethods();

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
        ((user.isFree && !user.hasPassLifetime) || (isTrial(subscription) && !hasTrialPaymentMethods)) &&
        !isB2BTrial &&
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
                            upsellConfig.onUpgrade();
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

    if (isReferralExpansionEnabled && isUserEligibleForReferral) {
        return (
            <TopNavbarListItem noCollapse>
                <TopNavReferralButton />
            </TopNavbarListItem>
        );
    }

    return null;
};

export default TopNavbarUpgradeButton;
