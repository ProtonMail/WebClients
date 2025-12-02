import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { SettingsLink } from '@proton/components';
import { useFlag } from '@proton/unleash';

import { useMeetContext } from '../../contexts/MeetContext';
import { UpgradeIcon } from '../UpgradeIcon/UpgradeIcon';

import './UpgradeButton.scss';

export const UpgradeButton = () => {
    const meetUpsellEnabled = useFlag('MeetUpsell');

    const { paidUser } = useMeetContext();

    if (!meetUpsellEnabled || paidUser) {
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
