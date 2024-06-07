import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

import { addDays } from 'date-fns';
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
import { freeTrialUpgradeClick } from '@proton/components/containers/desktop/openExternalLink';
import { useHasInboxDesktopInAppPayments } from '@proton/components/containers/desktop/useHasInboxDesktopInAppPayments';
import { useRedirectToAccountApp } from '@proton/components/containers/desktop/useRedirectToAccountApp';
import useButtonVariants from '@proton/components/hooks/useButtonVariants';
import { APPS, APP_NAMES, SHARED_UPSELL_PATHS, UPSELL_COMPONENT } from '@proton/shared/lib/constants';
import { getCookie, setCookie } from '@proton/shared/lib/helpers/cookies';
import { isElectronApp } from '@proton/shared/lib/helpers/desktop';
import { isTrial } from '@proton/shared/lib/helpers/subscription';
import { getUpgradePath, getUpsellRefFromApp } from '@proton/shared/lib/helpers/upsell';
import { getSecondLevelDomain } from '@proton/shared/lib/helpers/url';
import clsx from '@proton/utils/clsx';

import PromotionButton from '../button/PromotionButton/PromotionButton';
import TopNavbarListItem from './TopNavbarListItem';

interface Props {
    app?: APP_NAMES;
}

const cookieDomain = `.${getSecondLevelDomain(window.location.hostname)}`;
const IS_UPGRADE_BUTTON_HIDDEN = 'is-upgrade-button-hidden';

const getCookieExpiration = () => {
    const cookieButtonHidden = getCookie(IS_UPGRADE_BUTTON_HIDDEN);

    return cookieButtonHidden !== '1';
};

const TopNavbarUpgradeButton = ({ app }: Props) => {
    const [user] = useUser();
    const [subscription] = useSubscription();
    const location = useLocation();
    const { APP_NAME } = useConfig();
    const goToSettings = useSettingsLink();

    const upgradePathname = getUpgradePath({ user, subscription, app: APP_NAME });

    const { viewportWidth } = useActiveBreakpoint();

    const [displayUpgradeButton, setDisplayUpgradeButton] = useState(() => {
        // We want to have metrics from where the user has clicked on the upgrade button
        const displayUpgradeButtonInit =
            (user.isFree || isTrial(subscription)) &&
            !location.pathname.endsWith(upgradePathname) &&
            getCookieExpiration();

        return displayUpgradeButtonInit;
    });

    useEffect(() => {
        // we check every hour if cookie has expired
        const intervalID = window.setInterval(() => {
            setDisplayUpgradeButton(!location.pathname.endsWith(upgradePathname) && getCookieExpiration());
        }, 1000 * 3600);

        return () => {
            clearInterval(intervalID);
        };
    }, []);

    const { shouldDisplayVariant, variantInfos } = useButtonVariants();
    const isPillButton = !!variantInfos.additionnalStylesClass;

    const upsellRef = getUpsellRefFromApp({
        app: APP_NAME,
        feature: shouldDisplayVariant ? variantInfos.upsellPath : SHARED_UPSELL_PATHS.TOP_NAVIGATION_BAR,
        component: UPSELL_COMPONENT.BUTTON,
        fromApp: app,
    });

    const upgradeText = c('specialoffer: Link').t`Upgrade`;

    const upgradeIcon = upgradeText.length > 20 && viewportWidth['>=large'] ? undefined : 'upgrade';

    const upsellConfig = useUpsellConfig({ upsellRef, step: SUBSCRIPTION_STEPS.PLAN_SELECTION });
    const redirectToAccountApp = useRedirectToAccountApp();
    const hasInboxDesktopInAppPayments = useHasInboxDesktopInAppPayments();

    if (displayUpgradeButton) {
        return (
            <TopNavbarListItem noCollapse>
                <PromotionButton
                    as={ButtonLike}
                    onClick={() => {
                        // hide it for 2 days once clicked
                        setCookie({
                            cookieName: IS_UPGRADE_BUTTON_HIDDEN,
                            cookieValue: '1',
                            cookieDomain,
                            expirationDate: addDays(new Date(), 2).toUTCString(),
                            path: '/',
                        });
                        setDisplayUpgradeButton(false);

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
                    pill={isPillButton}
                    icon={viewportWidth['<=medium']}
                    iconGradient={!isPillButton}
                    className={clsx([shouldDisplayVariant && variantInfos.additionnalStylesClass])}
                >
                    {upgradeText}
                </PromotionButton>
            </TopNavbarListItem>
        );
    }

    return null;
};

export default TopNavbarUpgradeButton;
