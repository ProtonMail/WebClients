import * as React from 'react';

import { wait } from '@proton/shared/lib/helpers/promise';
import {
    IconName,
    SidebarListItem,
    SidebarListItemContent,
    SidebarListItemContentIcon,
    SidebarListItemLink,
    useLoading,
} from '@proton/components';

import { useDriveEventManager } from '../../../store';

interface Props {
    children: React.ReactNode;
    icon: IconName;
    isActive: boolean;
    shareId?: string;
    to: string;
    rightIcon?: React.ReactNode;
    onDoubleClick?: () => void;
}

const DriveSidebarListItem = ({ to, children, icon, shareId, isActive, rightIcon, onDoubleClick }: Props) => {
    const driveEventManager = useDriveEventManager();
    const [refreshing, withRefreshing] = useLoading(false);

    const left = icon ? <SidebarListItemContentIcon name={icon} /> : null;

    const handleDoubleClick = () => {
        onDoubleClick?.();
        if (!refreshing && shareId) {
            withRefreshing(Promise.all([driveEventManager.pollAllShareEvents(shareId), wait(1000)])).catch(
                console.warn
            );
        }
    };

    return (
        <SidebarListItem>
            <SidebarListItemLink to={to} isActive={() => isActive}>
                <SidebarListItemContent
                    onDoubleClick={handleDoubleClick}
                    left={left}
                    right={rightIcon}
                    title={typeof children === 'string' ? children : undefined}
                >
                    {children}
                </SidebarListItemContent>
            </SidebarListItemLink>
        </SidebarListItem>
    );
};

export default DriveSidebarListItem;
