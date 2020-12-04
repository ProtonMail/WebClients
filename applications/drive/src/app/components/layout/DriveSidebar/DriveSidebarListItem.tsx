import { noop } from 'proton-shared/lib/helpers/function';
import { wait } from 'proton-shared/lib/helpers/promise';
import React from 'react';
import {
    SidebarListItem,
    SidebarListItemContent,
    SidebarListItemContentIcon,
    SidebarListItemLink,
    useLoading,
} from 'react-components';
import { useRouteMatch } from 'react-router-dom';
import useEvents from '../../../hooks/drive/useEvents';
import LocationAside from './ReloadSpinner';

interface Props {
    to: string;
    icon: string;
    children: React.ReactNode;
    shareId?: string;
}
const DriveSidebarListItem = ({ to, children, icon, shareId }: Props) => {
    const match = useRouteMatch();
    const { callAll } = useEvents();
    const [refreshing, withRefreshing] = useLoading(false);

    const isActive = match.path === to;

    const left = icon ? <SidebarListItemContentIcon name={icon} /> : null;
    const right = isActive && shareId && <LocationAside refreshing={refreshing} />;

    const handleClick = () => {
        if (!refreshing && shareId) {
            withRefreshing(Promise.all([callAll(shareId), wait(1000)])).catch(noop);
        }
    };

    return (
        <SidebarListItem>
            <SidebarListItemLink to={to} isActive={() => isActive}>
                <SidebarListItemContent
                    onClick={handleClick}
                    left={left}
                    right={right}
                    title={typeof children === 'string' ? children : undefined}
                >
                    {children}
                </SidebarListItemContent>
            </SidebarListItemLink>
        </SidebarListItem>
    );
};

export default DriveSidebarListItem;
