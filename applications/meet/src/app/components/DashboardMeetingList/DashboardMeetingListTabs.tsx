import { forwardRef } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import clsx from '@proton/utils/clsx';

import { ConditionalTooltip } from '../ConditionalTooltip/ConditionalTooltip';
import { DashboardMeetingListTab } from './types';

import './DashboardMeetingListTabs.scss';

interface TabButtonProps {
    isActive: boolean;
    handleClick: () => void;
    tabName: string;
    tabCounter: number;
    tooltipTitle?: string;
}

const TabButton = ({ isActive, handleClick, tabName, tabCounter, tooltipTitle }: TabButtonProps) => {
    return (
        <ConditionalTooltip title={tooltipTitle}>
            <Button
                className={clsx(
                    'flex items-center rounded-full gap-2',
                    isActive ? 'meeting-tab-button-active' : 'meeting-tab-button-disabled'
                )}
                shape="ghost"
                size="large"
                onClick={handleClick}
            >
                {tabName}
                <div
                    className="meeting-list-tab-counter w-custom h-custom rounded-full flex items-center justify-center"
                    style={{ '--w-custom': '1.5rem', '--h-custom': '1.5rem' }}
                >
                    {tabCounter}
                </div>
            </Button>
        </ConditionalTooltip>
    );
};

interface DashboardMeetingListTabsProps {
    activeTab: DashboardMeetingListTab;
    setActiveTab: (tab: DashboardMeetingListTab) => void;
    timeBasedMeetingsCount: number;
    meetingRoomsCount: number;
    isStuck: boolean;
}

export const DashboardMeetingListTabs = forwardRef(
    (
        { activeTab, setActiveTab, timeBasedMeetingsCount, meetingRoomsCount, isStuck }: DashboardMeetingListTabsProps,
        ref: React.ForwardedRef<HTMLDivElement>
    ) => {
        return (
            <div
                ref={ref}
                className={clsx(
                    'dashboard-meeting-list-tabs flex align-items-center justify-start shrink-0',
                    isStuck && 'is-stuck'
                )}
            >
                <TabButton
                    isActive={activeTab === DashboardMeetingListTab.TimeBased}
                    handleClick={() => setActiveTab(DashboardMeetingListTab.TimeBased)}
                    tabName={c('Info').t`My meetings`}
                    tabCounter={timeBasedMeetingsCount}
                    tooltipTitle={c('Info').t`Only meetings you created appear here`}
                />
                <TabButton
                    isActive={activeTab === DashboardMeetingListTab.MeetingRooms}
                    handleClick={() => setActiveTab(DashboardMeetingListTab.MeetingRooms)}
                    tabName={c('Info').t`My rooms`}
                    tabCounter={meetingRoomsCount}
                />
            </div>
        );
    }
);

DashboardMeetingListTabs.displayName = 'DashboardMeetingListTabs';
