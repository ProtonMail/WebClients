import { useEffect, useState } from 'react';

import { clsx } from 'clsx';

import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import { Icon } from '@proton/components';

import { useSidebar } from '../../../providers/SidebarProvider';

import './CollapsibleSidebarSection.scss';

interface CollapsibleSidebarSectionProps {
    label: string;
    icon: React.ReactNode;
    showText: boolean;
    children?: React.ReactNode;
    onHeaderClick?: () => void;
    actionButton?: React.ReactNode;
    labelExtra?: React.ReactNode;
    className?: string;
}

export const CollapsibleSidebarSection = ({
    label,
    icon,
    showText,
    children,
    onHeaderClick,
    actionButton,
    labelExtra,
    className,
}: CollapsibleSidebarSectionProps) => {
    const [isExpanded, setIsExpanded] = useState(true);
    const [isHovered, setIsHovered] = useState(false);
    const { isCollapsed, isVisible, isSmallScreen, toggle } = useSidebar();

    useEffect(() => {
        if (isSmallScreen) {
            setIsExpanded(isVisible);
        } else if (isCollapsed) {
            setIsExpanded(false);
        } else {
            const timer = setTimeout(() => {
                setIsExpanded(true);
            }, 200);
            return () => clearTimeout(timer);
        }
    }, [isCollapsed, isVisible, isSmallScreen]);

    const handleToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsExpanded((prev) => !prev);
    };

    const handleContainerClick = () => {
        if (isCollapsed) {
            toggle();
        } else if (onHeaderClick) {
            onHeaderClick();
        } else {
            setIsExpanded((prev) => !prev);
        }
    };

    return (
        <div className={clsx('collapsible-sidebar-section', className)}>
            {isCollapsed ? (
                <Tooltip title={label} originalPlacement="right">
                    <button className="sidebar-item" onClick={toggle} aria-label={label}>
                        <div className="sidebar-item-icon">{icon}</div>
                    </button>
                </Tooltip>
            ) : (
                <>
                    {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
                    <div
                        className="collapsible-section-header flex items-center gap-1"
                        onClick={handleContainerClick}
                        onMouseEnter={() => setIsHovered(true)}
                        onMouseLeave={() => setIsHovered(false)}
                    >
                        <div className={clsx('sidebar-item flex-1', !showText && 'collapsed')}>
                            <button
                                className="collapsible-section-icon-button"
                                onClick={handleToggle}
                                aria-label={isExpanded ? `Collapse ${label}` : `Expand ${label}`}
                                aria-expanded={isExpanded}
                            >
                                <div className="sidebar-item-icon">
                                    {!isHovered && showText && icon}
                                    {isHovered && (
                                        <Icon name={isExpanded ? 'chevron-down' : 'chevron-right'} size={4} />
                                    )}
                                </div>
                            </button>
                            <span className={clsx('sidebar-item-text', !showText && 'hidden')}>
                                {label}
                                {labelExtra}
                            </span>
                            {!isSmallScreen && showText && actionButton}
                        </div>
                    </div>
                    {isExpanded && showText && children}
                </>
            )}
        </div>
    );
};
