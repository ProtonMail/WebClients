import { c } from 'ttag';

import { useSubscription } from '@proton/account/subscription/hooks';
import { Button } from '@proton/atoms';
import { SettingsLink } from '@proton/components';
import useUid from '@proton/components/hooks/useUid';
import { IcUpgrade } from '@proton/icons/icons/IcUpgrade';
import { hasVisionary } from '@proton/payments';
import { useFlag } from '@proton/unleash';

import './UpgradeButton.scss';

export const UpgradeButton = () => {
    const uid1 = useUid('linear-gradient-1');
    const uid2 = useUid('linear-gradient-2');
    const [subscription] = useSubscription();
    const meetUpsellEnabled = useFlag('MeetUpsell');

    if (!meetUpsellEnabled || hasVisionary(subscription)) {
        return null;
    }

    return (
        <SettingsLink path={'/dashboard'} target={'_blank'}>
            <Button
                icon={true}
                className="apps-dropdown-button shrink-0 md:hidden button-promotion button-promotion--icon-gradient color-norm"
            >
                <IcUpgrade
                    alt={c('Action').t`Upgrade`}
                    size={5}
                    className="apps-dropdown-button-icon shrink-0 no-print"
                    style={{ fill: `url(#${uid1}) var(--text-norm)` }}
                />
                <svg aria-hidden="true" focusable="false" className="sr-only">
                    <linearGradient id={uid1}>
                        <stop offset="0%" stopColor="var(--color-stop-1)" />
                        <stop offset="50%" stopColor="var(--color-stop-2)" />
                        <stop offset="100%" stopColor="var(--color-stop-3)" />
                    </linearGradient>
                </svg>
            </Button>
            <Button
                size="medium"
                shape="ghost"
                color="norm"
                className="button-promotion button-promotion-background-color button-promotion--icon-gradient rounded-full mr-5 hidden md:inline-block color-norm"
            >
                <IcUpgrade
                    alt={c('Action').t`Upgrade`}
                    size={5}
                    className="mr-2"
                    style={{ fill: `url(#${uid2}) var(--text-norm)` }}
                />
                <svg aria-hidden="true" focusable="false" className="sr-only">
                    <linearGradient id={uid2}>
                        <stop offset="0%" stopColor="var(--color-stop-1)" />
                        <stop offset="50%" stopColor="var(--color-stop-2)" />
                        <stop offset="100%" stopColor="var(--color-stop-3)" />
                    </linearGradient>
                </svg>
                {c('Upgrade Button').t`Upgrade`}
            </Button>
        </SettingsLink>
    );
};
