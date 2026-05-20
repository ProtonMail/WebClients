import { useEffect, useState } from 'react';

import { clsx } from 'clsx';

import { IcChevronDown } from '@proton/icons/icons/IcChevronDown';
import { IcChevronRight } from '@proton/icons/icons/IcChevronRight';

import { useSidebar } from '../../../providers/SidebarProvider';

import './CollapsibleSidebarSection.scss';

interface CollapsibleSidebarSectionProps {
    label: string;
    children?: React.ReactNode;
    onHeaderClick?: () => void;
    actionButton?: React.ReactNode;
    labelExtra?: React.ReactNode;
    className?: string;
}

export const CollapsibleSidebarSection = ({
    label,
    children,
    onHeaderClick,
    actionButton,
    labelExtra,
    className,
}: CollapsibleSidebarSectionProps) => {
    const [isExpanded, setIsExpanded] = useState(true);
    const [isHovered, setIsHovered] = useState(false);
    const { isVisible, isSmallScreen } = useSidebar();

    useEffect(() => {
        if (isSmallScreen) {
            setIsExpanded(isVisible);
        }
    }, [isVisible, isSmallScreen]);

    const handleContainerClick = () => {
        setIsExpanded((prev) => !prev);
        onHeaderClick?.();
    };

    return (
        <div className={clsx('collapsible-sidebar-section flex-nowrap', className)}>
            {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
            <div
                className="collapsible-section-header flex items-center cursor-pointer py-2 px-1.5 rounded-lg"
                onClick={handleContainerClick}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                <span className="flex-1 flex items-center gap-1 font-bold text-nowrap overflow-hidden">
                    <span className="collapsible-section--title overflow-hidden text-ellipsis">{label}</span>
                    {labelExtra}
                    {isHovered && (
                        <>
                            {isExpanded ? (
                                <IcChevronDown size={3} className="shrink-0" />
                            ) : (
                                <IcChevronRight size={3} className="shrink-0" />
                            )}
                        </>
                    )}
                </span>
                {!isSmallScreen && actionButton}
            </div>
            {isExpanded && children}
        </div>
    );
};
