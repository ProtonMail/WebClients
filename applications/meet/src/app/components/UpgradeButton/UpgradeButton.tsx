import { c } from 'ttag';

import { useSubscription } from '@proton/account/subscription/hooks';
import { Button } from '@proton/atoms/Button/Button';
import { SettingsLink } from '@proton/components';
import { hasVisionary } from '@proton/payments';
import { useFlag } from '@proton/unleash';

import { UpgradeIcon } from '../UpgradeIcon/UpgradeIcon';

import './UpgradeButton.scss';

export const UpgradeButton = () => {
    const [subscription] = useSubscription();
    const meetUpsellEnabled = useFlag('MeetUpsell');

    if (!meetUpsellEnabled || hasVisionary(subscription)) {
        return null;
    }

    return (
        <SettingsLink path={'/dashboard'} target={'_blank'} className="upgrade-button-link">
            <Button icon={true} className="shrink-0 md:hidden button-promotion color-norm">
                <UpgradeIcon />
            </Button>
            <Button
                size="medium"
                shape="ghost"
                color="norm"
                className="button-promotion rounded-full mr-5 hidden md:flex color-norm flex-nowrap"
            >
                <UpgradeIcon />
                <div className="ml-2">{c('Upgrade Button').t`Upgrade`}</div>
            </Button>
        </SettingsLink>
    );
};
