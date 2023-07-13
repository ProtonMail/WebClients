import * as React from 'react';
import { MouseEventHandler } from 'react';

import {
    IconName,
    SidebarListItem,
    SidebarListItemContent,
    SidebarListItemContentIcon,
    SidebarListItemLink,
} from '@proton/components';
import { useLoading } from '@proton/hooks';
import { wait } from '@proton/shared/lib/helpers/promise';

import { useDriveEventManager } from '../../../../store';
import { useVolumesState } from '../../../../store/_volumes';

interface Props {
    children: React.ReactNode;
    icon: IconName;
    isActive: boolean;
    shareId?: string;
    to: string;
    rightIcon?: React.ReactNode;
    onDoubleClick?: () => void;
    style?: React.CSSProperties;
    onClick?: MouseEventHandler<HTMLLIElement>;
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
            <SidebarListItemLink to={to} isActive={() => isActive}>
                <div className="flex flex-nowrap" style={style}>
                    <SidebarListItemContent
                        onDoubleClick={handleDoubleClick}
                        left={left}
                        right={rightIcon}
                        title={typeof children === 'string' ? children : undefined}
                    >
                        {children}
                    </SidebarListItemContent>
                </div>
            </SidebarListItemLink>
        </SidebarListItem>
    );
};

export default DriveSidebarListItem;
