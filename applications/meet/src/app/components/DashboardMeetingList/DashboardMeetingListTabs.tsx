import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import clsx from '@proton/utils/clsx';

import { DashboardMeetingListTab } from './types';

import './DashboardMeetingListTabs.scss';

interface TabButtonProps {
    isActive: boolean;
    handleClick: () => void;
    tabName: string;
    tabCounter: number;
}

const TabButton = ({ isActive, handleClick, tabName, tabCounter }: TabButtonProps) => {
    return (
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
    );
};

interface DashboardMeetingListTabsProps {
    activeTab: DashboardMeetingListTab;
    setActiveTab: (tab: DashboardMeetingListTab) => void;
    timeBasedMeetingsCount: number;
    meetingRoomsCount: number;
}

export const DashboardMeetingListTabs = ({
    activeTab,
    setActiveTab,
    timeBasedMeetingsCount,
    meetingRoomsCount,
}: DashboardMeetingListTabsProps) => {
    return (
        <div className="dashboard-meeting-list-tabs flex align-items-center justify-start shrink-0">
            <TabButton
                isActive={activeTab === DashboardMeetingListTab.TimeBased}
                handleClick={() => setActiveTab(DashboardMeetingListTab.TimeBased)}
                tabName={c('Info').t`My meetings`}
                tabCounter={timeBasedMeetingsCount}
            />
            <TabButton
                isActive={activeTab === DashboardMeetingListTab.MeetingRooms}
                handleClick={() => setActiveTab(DashboardMeetingListTab.MeetingRooms)}
                tabName={c('Info').t`My rooms`}
                tabCounter={meetingRoomsCount}
            />
        </div>
    );
};
