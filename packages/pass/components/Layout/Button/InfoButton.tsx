import type { MouseEventHandler } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import Icon, { type IconName } from '@proton/components/components/icon/Icon';
import clsx from '@proton/utils/clsx';

type Props = {
    onClick?: MouseEventHandler<HTMLButtonElement>;
    iconName?: IconName;
    className?: string;
};

export const InfoButton = ({ onClick, className, iconName = 'question-circle' }: Props) => (
    <Button className={clsx('button-xs', className)} onClick={onClick} pill shape="ghost" icon size="small">
        <Icon name={iconName} alt={c('Action').t`More info`} size={3} />
    </Button>
);
