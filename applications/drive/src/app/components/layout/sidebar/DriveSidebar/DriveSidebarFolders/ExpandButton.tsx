import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Icon, classnames } from '@proton/components';

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
            className={classnames([
                'flex-item-noshrink flex flex-align-items-center drive-sidebar--button-expand',
                className,
            ])}
            onClick={handleClick}
            aria-expanded={expanded}
            title={expanded ? c('Action').t`Collapse folder` : c('Action').t`Expand folder`}
            style={style}
        >
            <Icon
                name={expanded ? 'chevron-down' : 'chevron-right'}
                alt={expanded ? c('Action').t`Collapse folder` : c('Action').t`Expand folder`}
            />
        </Button>
    );
}
