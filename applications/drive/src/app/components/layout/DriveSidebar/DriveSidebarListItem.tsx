import * as React from 'react';

import { noop } from '@proton/shared/lib/helpers/function';
import { wait } from '@proton/shared/lib/helpers/promise';
import {
    SidebarListItem,
    SidebarListItemContent,
    SidebarListItemContentIcon,
    SidebarListItemLink,
    useLoading,
} from '@proton/components';

import useDriveEvents from '../../../hooks/drive/useDriveEvents';

interface Props {
    children: React.ReactNode;
    icon: string;
    isActive: boolean;
    shareId?: string;
    to: string;
    rightIcon?: React.ReactNode;
}
const DriveSidebarListItem = ({ to, children, icon, shareId, isActive, rightIcon }: Props) => {
    const driveEvents = useDriveEvents();
    const [refreshing, withRefreshing] = useLoading(false);

    const left = icon ? <SidebarListItemContentIcon name={icon} /> : null;

    const handleRefresh = () => {
        if (!refreshing && shareId) {
            withRefreshing(Promise.all([driveEvents.callAll(shareId), wait(1000)])).catch(noop);
        }
    };

    return (
        <SidebarListItem>
            <SidebarListItemLink to={to} isActive={() => isActive}>
                <SidebarListItemContent
                    onDoubleClick={handleRefresh}
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
