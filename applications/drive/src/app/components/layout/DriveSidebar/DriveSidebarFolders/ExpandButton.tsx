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
            className={classnames(['flex-item-noshrink drive-sidebar--icon-expand', className])}
            onClick={handleClick}
        >
            <Icon name="angle-down" className={classnames([!expanded && 'rotateZ-270'])} />
        </Button>
    );
}
