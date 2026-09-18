import type { FC } from 'react';

import { c } from 'ttag';

import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import Icon from '@proton/components/components/icon/Icon';
import clsx from '@proton/utils/clsx';

type Props = {
    expanded: boolean;
    onClick: (e: React.MouseEvent) => void;
    className?: string;
    hidden?: boolean;
    titleExpanded?: string;
    titleCollapsed?: string;
};

export const PassExpandButton: FC<Props> = ({
    expanded,
    onClick,
    className,
    hidden = false,
    titleExpanded = c('Action').t`Collapse`,
    titleCollapsed = c('Action').t`Expand`,
}) => {
    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        onClick(e);
    };

    return (
        <ButtonLike
            as="span"
            shape="ghost"
            size="small"
            icon
            className={clsx('shrink-0 flex items-center color-weak', hidden && 'visibility-hidden', className)}
            /** Stay clickable inside rows that disable pointer events when selected */
            style={{ pointerEvents: 'auto' }}
            onClick={handleClick}
            aria-expanded={expanded}
            title={expanded ? titleExpanded : titleCollapsed}
        >
            <Icon name={expanded ? 'chevron-down-filled' : 'chevron-right-filled'} />
        </ButtonLike>
    );
};
