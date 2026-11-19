import { useEffect, useState } from 'react';

import { clsx } from 'clsx';
import { c } from 'ttag';

import { LumoIcon } from '../../../components/LumoIcon/LumoIcon';
import { AttentionDot } from '../../../components/StatusDot/AttentionDot';
import { useSidebar } from '../../../providers/SidebarProvider';

import './CollapsibleSidebarSection.scss';

interface CollapsibleSidebarSectionProps {
    label: string;
    children?: React.ReactNode;
    onHeaderClick?: () => void;
    actionButton?: React.ReactNode;
    labelExtra?: React.ReactNode;
    className?: string;
    /** Set when an item of the section waits on the user: the header shows a dot while the section is collapsed. */
    attentionKey?: string;
}

export const CollapsibleSidebarSection = ({
    label,
    children,
    onHeaderClick,
    actionButton,
    labelExtra,
    className,
    attentionKey,
}: CollapsibleSidebarSectionProps) => {
    const [isExpanded, setIsExpanded] = useState(true);
    const [isHovered, setIsHovered] = useState(false);
    const { isVisible, isSmallScreen } = useSidebar();
    const collapsedAttentionKey = isExpanded ? undefined : attentionKey;

    useEffect(() => {
        if (isSmallScreen) {
            setIsExpanded((previous) => (previous === isVisible ? previous : isVisible));
        }
    }, [isVisible, isSmallScreen]);

    const handleContainerClick = () => {
        setIsExpanded((prev) => !prev);
        onHeaderClick?.();
    };

    return (
        <div className={clsx('collapsible-sidebar-section flex flex-column min-w-0 flex-nowrap', className)}>
            <div
                className={clsx(
                    'collapsible-section-header flex items-center py-2 px-1.5 rounded-lg',
                    collapsedAttentionKey && 'collapsible-section-header--with-attention relative flex-nowrap'
                )}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
                <div
                    className="flex-1 flex items-center gap-1 font-bold text-nowrap overflow-hidden cursor-pointer min-w-0"
                    onClick={handleContainerClick}
                >
                    <span className="collapsible-section--title overflow-hidden text-ellipsis">{label}</span>
                    {labelExtra}
                    {collapsedAttentionKey && (
                        <AttentionDot
                            attentionKey={collapsedAttentionKey}
                            className="sidebar-status-dot-slot"
                            label={
                                // translator: Read out after a collapsed sidebar heading, such as Favorites or Projects, when a chat inside it waits for the user's answer or approval.
                                c('collider_2025:Info').t`Something here is waiting for you`
                            }
                        />
                    )}
                    {isHovered && (
                        <>
                            {isExpanded ? (
                                <LumoIcon name="ChevronDown" width={12} height={12} className="shrink-0" />
                            ) : (
                                <LumoIcon name="ChevronRight" width={12} height={12} className="shrink-0" />
                            )}
                        </>
                    )}
                </div>
                {!isSmallScreen && actionButton}
            </div>
            {isExpanded && children}
        </div>
    );
};
