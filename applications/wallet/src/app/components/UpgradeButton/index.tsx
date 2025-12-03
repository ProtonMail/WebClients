import { c } from 'ttag';

import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import { Icon } from '@proton/components';
import useUid from '@proton/components/hooks/useUid';

import { Button } from '../../atoms';
import { useUpsellModal } from '../../hooks/useUpsellModal';

import './UpgradeButton.scss';

export const UpgradeButton = () => {
    const uid = useUid('linear-gradient');
    const [user] = useUser();
    const [subscription] = useSubscription();
    const [openUpsellModal] = useUpsellModal(subscription);

    if (user.isPaid) {
        return <></>;
    }

    return (
        <Button
            size="small"
            shape="ghost"
            color="norm"
            className="my-2 button-lighter button-promotion button-promotion--icon-gradient ml-2"
            onClick={openUpsellModal}
        >
            <Icon
                alt={c('Action').t`Upgrade`}
                name="upgrade"
                className="mr-2"
                size={5}
                style={{ fill: `url(#${uid}) var(--text-norm)` }}
            />
            <svg aria-hidden="true" focusable="false" className="sr-only">
                <linearGradient id={uid}>
                    <stop offset="0%" stopColor="var(--color-stop-1)" />
                    <stop offset="50%" stopColor="var(--color-stop-2)" />
                    <stop offset="100%" stopColor="var(--color-stop-3)" />
                </linearGradient>
            </svg>
            {c('Wallet header').t`Upgrade`}
        </Button>
    );
};
