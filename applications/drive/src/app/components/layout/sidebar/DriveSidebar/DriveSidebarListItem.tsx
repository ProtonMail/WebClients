import * as React from 'react';

import {
    IconName,
    SidebarListItem,
    SidebarListItemContent,
    SidebarListItemContentIcon,
    SidebarListItemLink,
    useLoading,
} from '@proton/components';
import { wait } from '@proton/shared/lib/helpers/promise';

import { useDriveEventManager } from '../../../../store';

interface Props {
    children: React.ReactNode;
    icon: IconName;
    isActive: boolean;
    shareId?: string;
    to: string;
    rightIcon?: React.ReactNode;
    onDoubleClick?: () => void;
    style?: React.CSSProperties;
}

const DriveSidebarListItem = ({ to, children, icon, shareId, isActive, rightIcon, onDoubleClick, style }: Props) => {
    const driveEventManager = useDriveEventManager();
    const [refreshing, withRefreshing] = useLoading(false);

    const left = icon ? <SidebarListItemContentIcon name={icon} /> : null;

    const handleDoubleClick = () => {
        onDoubleClick?.();
        if (!refreshing && shareId) {
            withRefreshing(
                Promise.all([driveEventManager.pollEvents.shares([shareId], { includeCommon: true }), wait(1000)])
            ).catch(console.warn);
        }
    };

    return (
        <SidebarListItem>
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
