import { useLocation } from 'react-router-dom';

import { c } from 'ttag';

import { SettingsLink, useConfig, useSubscription, useUser } from '@proton/components';
import { APP_NAMES, UPSELL_COMPONENT } from '@proton/shared/lib/constants';
import { isTrial } from '@proton/shared/lib/helpers/subscription';
import { addUpsellPath, getUpgradePath, getUpsellRefFromApp } from '@proton/shared/lib/helpers/upsell';

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

    const upgradePathname = getUpgradePath({ user, subscription, app: APP_NAME });

    const upsellRef = getUpsellRefFromApp({
        app: APP_NAME,
        feature: '1',
        component: UPSELL_COMPONENT.BUTTON,
        fromApp: app,
    });
    // We want to have metrics from where the user has clicked on the upgrade button
    const upgradeUrl = addUpsellPath(upgradePathname, upsellRef);
    const displayUpgradeButton = (user.isFree || isTrial(subscription)) && !location.pathname.endsWith(upgradePathname);

    if (displayUpgradeButton) {
        return (
            <TopNavbarListItem noCollapse>
                <PromotionButton
                    as={SettingsLink}
                    iconName="upgrade"
                    path={upgradeUrl}
                    responsive
                    title={c('specialoffer: Link').t`Go to subscription plans`}
                    data-testid="cta:upgrade-plan"
                >{c('specialoffer: Link').t`Upgrade`}</PromotionButton>
            </TopNavbarListItem>
        );
    }

    return null;
};

export default TopNavbarUpgradeButton;
