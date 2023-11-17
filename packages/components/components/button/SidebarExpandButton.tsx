import { Button } from '@proton/atoms';
import { Icon } from '@proton/components';
import clsx from '@proton/utils/clsx';

interface Props {
    title: string;
    className?: string;
    expanded: boolean;
    onClick: () => void;
    style?: React.CSSProperties;
}

export default function SidebarExpandButton({ className, title, expanded, onClick, style }: Props) {
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
            className={clsx(['shrink-0 flex items-center drive-sidebar--button-expand', className])}
            onClick={handleClick}
            aria-expanded={expanded}
            title={title}
            style={style}
            data-testid={expanded ? 'sidebar-expanded-folder' : 'sidebar-expand-folder'}
        >
            <Icon name={expanded ? 'chevron-down-filled' : 'chevron-right-filled'} alt={title} />
        </Button>
    );
}
