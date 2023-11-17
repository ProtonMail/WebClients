import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Icon } from '@proton/components';
import clsx from '@proton/utils/clsx';

interface Props {
    className?: string;
    expanded: boolean;
    onClick: () => void;
    style?: React.CSSProperties;
}

export default function ExpandButton({ className, expanded, onClick, style }: Props) {
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        e.preventDefault();
        onClick();
    };

    return (
        <Button
            shape="ghost"
            size="small"
            icon
            className={clsx([
                'flex-item-noshrink flex items-center drive-sidebar--button-expand',
                className,
            ])}
            onClick={handleClick}
            aria-expanded={expanded}
            title={expanded ? c('Action').t`Collapse folder` : c('Action').t`Expand folder`}
            style={style}
            data-testid="sidebar-expand-folder"
        >
            <Icon
                name={expanded ? 'chevron-down-filled' : 'chevron-right-filled'}
                alt={expanded ? c('Action').t`Collapse folder` : c('Action').t`Expand folder`}
            />
        </Button>
    );
}
