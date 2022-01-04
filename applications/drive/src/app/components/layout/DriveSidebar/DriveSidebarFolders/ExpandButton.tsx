import { c } from 'ttag';

import { classnames, Button, Icon } from '@proton/components';

interface Props {
    className?: string;
    expanded: boolean;
    onClick: () => void;
}

export default function ExpandButton({ className, expanded, onClick }: Props) {
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
            className={classnames([
                'flex-item-noshrink flex flex-align-items-center drive-sidebar--button-expand',
                className,
            ])}
            onClick={handleClick}
            aria-expanded={expanded}
            title={expanded ? c('Action').t`Collapse folder` : c('Action').t`Expand folder`}
        >
            <Icon
                name="angle-down"
                className={classnames([!expanded && 'rotateZ-270'])}
                alt={expanded ? c('Action').t`Collapse folder` : c('Action').t`Expand folder`}
            />
        </Button>
    );
}
