import type { ButtonProps } from '@proton/atoms';
import { Button } from '@proton/atoms';
import type { IconProps } from '@proton/components/components/icon/Icon';
import Icon from '@proton/components/components/icon/Icon';
import clsx from '@proton/utils/clsx';

interface Props {
    title: string;
    className?: string;
    expanded: boolean;
    onClick: () => void;
    style?: React.CSSProperties;
    size?: IconProps['size'];
    pill?: ButtonProps['pill'];
    iconCollapsed?: IconProps['name'];
    iconExpanded?: IconProps['name'];
}

export default function SidebarExpandButton({
    className,
    title,
    expanded,
    onClick,
    style,
    size,
    pill,
    iconCollapsed = 'chevron-right-filled',
    iconExpanded = 'chevron-down-filled',
}: Props) {
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
            pill={pill}
        >
            <Icon size={size} name={expanded ? iconExpanded : iconCollapsed} alt={title} />
        </Button>
    );
}
