import type { MouseEventHandler } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import type { IconComponent } from '@proton/icons/component';
import { IcQuestionCircle } from '@proton/icons/icons/IcQuestionCircle';
import clsx from '@proton/utils/clsx';

type Props = {
    onClick?: MouseEventHandler<HTMLButtonElement>;
    iconName?: IconComponent;
    className?: string;
};

export const InfoButton = ({ onClick, className, iconName: Icon = IcQuestionCircle }: Props) => (
    <Button className={clsx('button-xs', className)} onClick={onClick} pill shape="ghost" icon size="small">
        <Icon alt={c('Action').t`More info`} size={3} />
    </Button>
);
