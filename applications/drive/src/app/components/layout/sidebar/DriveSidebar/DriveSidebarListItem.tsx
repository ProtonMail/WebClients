import * as React from 'react';
import type { MouseEventHandler } from 'react';
import type { NavLink } from 'react-router-dom';

import type { IconName } from '@proton/components';
import {
    SidebarListItem,
    SidebarListItemContent,
    SidebarListItemContentIcon,
    SidebarListItemLink,
} from '@proton/components';
import { useLoading } from '@proton/hooks';
import { wait } from '@proton/shared/lib/helpers/promise';
import clsx from '@proton/utils/clsx';

import { useDriveEventManager } from '../../../../store';
import { useVolumesState } from '../../../../store/_volumes';

interface Props {
    children: React.ReactNode;
    icon: IconName;
    isActive: React.ComponentProps<NavLink>['isActive'];
    shareId?: string;
    to: string;
    rightIcon?: React.ReactNode;
    onDoubleClick?: () => void;
    style?: React.CSSProperties;
    onClick?: MouseEventHandler<HTMLLIElement>;
    className?: string;
}

const DriveSidebarListItem = ({
    to,
    children,
    icon,
    shareId,
    isActive,
    rightIcon,
    onDoubleClick,
    style,
    onClick,
    className,
}: Props) => {
    const driveEventManager = useDriveEventManager();
    const volumeState = useVolumesState();
    const [refreshing, withRefreshing] = useLoading(false);

    const left = icon ? <SidebarListItemContentIcon name={icon} /> : null;

    const handleDoubleClick = () => {
        onDoubleClick?.();

        if (!refreshing && shareId) {
            const volumeId = volumeState.findVolumeId(shareId);

            if (volumeId) {
                withRefreshing(
                    Promise.all([driveEventManager.pollEvents.driveEvents({ includeCommon: true }), wait(1000)])
                ).catch(console.warn);
            }
        }
    };

    return (
        <SidebarListItem onClick={onClick}>
            <SidebarListItemLink to={to} isActive={isActive}>
                <SidebarListItemContent
                    className={clsx(className, 'flex flex-nowrap')}
                    onDoubleClick={handleDoubleClick}
                    left={left}
                    right={rightIcon}
                    title={typeof children === 'string' ? children : undefined}
                    data-testid="sidebar-main-sections"
                    style={style}
                >
                    {children}
                </SidebarListItemContent>
            </SidebarListItemLink>
        </SidebarListItem>
    );
};

export default DriveSidebarListItem;
