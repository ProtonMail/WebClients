import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Icon } from '@proton/components/components';
import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';

export const PromotionUpgradeButton = () => {
    const { onLink, config } = usePassCore();

    return (
        <Button
            className="items-center flex-nowrap shrink-0 flex text-sm"
            color="norm"
            onClick={() =>
                onLink(`${config.SSO_URL}/pass/signup?plan=pass2023&cycle=12&coupon=EOY2023`, { replace: true })
            }
            shape="solid"
            pill
        >
            {c('Action').t`Upgrade`}
            <Icon className="ml-2" name="arrow-out-square" />
        </Button>
    );
};
