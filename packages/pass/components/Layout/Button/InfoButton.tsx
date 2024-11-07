import { type MouseEventHandler } from 'react';

import { c } from 'ttag';

import Icon, { type IconName } from '@proton/components/components/icon/Icon';
import clsx from '@proton/utils/clsx';

type Props = {
    onClick?: MouseEventHandler<HTMLButtonElement>;
    iconName?: IconName;
    className?: string;
};

export const InfoButton = ({ onClick, className, iconName = 'question-circle' }: Props) => {
    return (
        <button
            className={clsx(
                'inline-flex color-inherit relative rounded-full interactive-pseudo interactive--no-background',
                className
            )}
            onClick={onClick}
            type="button"
        >
            <Icon name={iconName} alt={c('Action').t`More info`} />
        </button>
    );
};
