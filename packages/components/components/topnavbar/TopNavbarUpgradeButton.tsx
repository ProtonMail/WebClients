import { useLocation } from 'react-router-dom';

import { c } from 'ttag';

import { Icon, SettingsLink, useConfig, useSubscription, useUser } from '@proton/components';
import { APPS, APP_NAMES, UPSELL_COMPONENT } from '@proton/shared/lib/constants';
import { isTrial } from '@proton/shared/lib/helpers/subscription';
import { getUpsellRefFromApp } from '@proton/shared/lib/helpers/upsell';

import TopNavbarListItem from './TopNavbarListItem';
import TopNavbarListItemButton from './TopNavbarListItemButton';

interface Props {
    app?: APP_NAMES;
}
const TopNavbarUpgradeButton = ({ app }: Props) => {
    const [user] = useUser();
    const [subscription] = useSubscription();
    const location = useLocation();
    const { APP_NAME } = useConfig();

    const isVPN = APP_NAME === APPS.PROTONVPN_SETTINGS;
    const upgradePathname = isVPN ? '/dashboard' : '/upgrade';

    const upsellRef = getUpsellRefFromApp({
        app: APP_NAME,
        feature: '1',
        component: UPSELL_COMPONENT.BUTTON,
        fromApp: app,
    });
    // We want to have metrics from where the user has clicked on the upgrade button
    const upgradeUrl = `${upgradePathname}?ref=${upsellRef}`;
    const displayUpgradeButton = (user.isFree || isTrial(subscription)) && !location.pathname.endsWith(upgradePathname);

    if (displayUpgradeButton) {
        return (
            <TopNavbarListItem noShrink collapsedOnDesktop={false}>
                <TopNavbarListItemButton
                    as={SettingsLink}
                    shape="outline"
                    color="norm"
                    text={c('specialoffer: Link').t`Upgrade`}
                    icon={<Icon name="arrow-up-big-line" />}
                    path={upgradeUrl}
                    title={c('specialoffer: Link').t`Go to subscription plans`}
                    data-testid="cta:upgrade-plan"
                />
            </TopNavbarListItem>
        );
    }

    return null;
};

export default TopNavbarUpgradeButton;
