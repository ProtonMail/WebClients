import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { SettingsLink } from '@proton/components';
import { useMeetSelector } from '@proton/meet/store/hooks';
import { selectSubscriptionStatus } from '@proton/meet/store/slices/userSlice';
import { useFlag } from '@proton/unleash/useFlag';

import { UpgradeIcon } from '../UpgradeIcon/UpgradeIcon';

import './UpgradeButton.scss';

export const UpgradeButton = () => {
    const meetUpsellEnabled = useFlag('MeetUpsell');

    const { isPaidUser } = useMeetSelector(selectSubscriptionStatus);

    if (!meetUpsellEnabled || isPaidUser) {
        return null;
    }

    return (
        <SettingsLink path={'/dashboard'} target={'_blank'} className="upgrade-button-link">
            <Button icon={true} className="shrink-0 md:hidden button-promotion color-norm">
                <UpgradeIcon />
                <span className="sr-only">{c('Accessibility').t`Upgrade (opens in new tab)`}</span>
            </Button>
            <Button
                size="medium"
                shape="ghost"
                color="norm"
                className="button-promotion rounded-full mr-5 hidden md:flex color-norm flex-nowrap"
            >
                <UpgradeIcon />
                <div className="ml-2">{c('Upgrade Button').t`Upgrade`}</div>
                <span className="sr-only">{c('Accessibility').t`(opens in new tab)`}</span>
            </Button>
        </SettingsLink>
    );
};
