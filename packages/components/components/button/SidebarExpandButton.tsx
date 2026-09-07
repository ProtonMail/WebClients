import type { ReactElement } from 'react';

import type { ButtonProps } from '@proton/atoms/Button/Button';
import { Button } from '@proton/atoms/Button/Button';
import { IcChevronDownFilled } from '@proton/icons/icons/IcChevronDownFilled';
import { IcChevronRightFilled } from '@proton/icons/icons/IcChevronRightFilled';
import clsx from '@proton/utils/clsx';

interface Props {
    title: string;
    className?: string;
    expanded: boolean;
    onClick: () => void;
    style?: React.CSSProperties;
    pill?: ButtonProps['pill'];
    iconCollapsed?: ReactElement;
    iconExpanded?: ReactElement;
}

export default function SidebarExpandButton({
    className,
    title,
    expanded,
    onClick,
    style,
    pill,
    iconCollapsed = <IcChevronRightFilled />,
    iconExpanded = <IcChevronDownFilled />,
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
            <>
                {expanded ? iconExpanded : iconCollapsed}
                <span className="sr-only">{title}</span>
            </>
        </Button>
    );
}
