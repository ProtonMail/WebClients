import { Button } from '@proton/atoms';
import { Icon, IconProps } from '@proton/components';
import clsx from '@proton/utils/clsx';

interface Props {
    title: string;
    className?: string;
    expanded: boolean;
    onClick: () => void;
    style?: React.CSSProperties;
    size?: IconProps['size'];
}

export default function SidebarExpandButton({ className, title, expanded, onClick, style, size }: Props) {
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
            <Icon size={size} name={expanded ? 'chevron-down-filled' : 'chevron-right-filled'} alt={title} />
        </Button>
    );
}
