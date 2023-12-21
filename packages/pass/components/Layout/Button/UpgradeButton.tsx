import { type VFC } from 'react';

import { c } from 'ttag';

import { Button, InlineLinkButton } from '@proton/atoms';
import { Icon } from '@proton/components/components';
import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import { PASS_UPGRADE_PATH } from '@proton/pass/constants';
import clsx from '@proton/utils/clsx';

type UpgradeButtonProps = {
    className?: string;
    inline?: boolean;
    label?: string;
    path?: string;
    ref: string
};

export const UpgradeButton: VFC<UpgradeButtonProps> = ({
    className,
    inline = false,
    label,
    path = PASS_UPGRADE_PATH,
    ref
}) => {
    const { onLink, config } = usePassCore();
    const ButtonComponent = inline ? InlineLinkButton : Button;
    const buttonProps = { pill: true, shape: 'solid' } as const;

    return (
        <ButtonComponent
            className={clsx('items-center flex-nowrap shrink-0', inline ? 'inline-flex' : 'flex text-sm', className)}
            color="norm"
            onClick={() => onLink(`${config.SSO_URL}/${path}&ref=${ref}`, { replace: true })}
            {...(!inline && buttonProps)}
        >
            {label || c('Action').t`Upgrade`}
            <Icon className="ml-2" name="arrow-out-square" />
        </ButtonComponent>
    );
};
