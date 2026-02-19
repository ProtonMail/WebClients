import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { IcLink } from '@proton/icons/icons/IcLink';
import { isElectronApp } from '@proton/shared/lib/helpers/desktop';
import type { Meeting } from '@proton/shared/lib/interfaces/Meet';

import { CreateMeetingDropdown } from '../../components/CreateMeetingDropdown/CreateMeetingDropdown';
import { DashboardMeetingListLoading } from '../../components/DashboardMeetingList/DashboardMeetingListLoading';
import { PageHeader } from '../../components/PageHeader/PageHeader';
import { UpsellBannerWithUser } from '../../components/UpsellBanner/UpsellBanner';
import type { MeetingListStatus } from '../../hooks/useMeetingList';

import './DashboardContainerBody.scss';

interface DashboardContainerBodyProps {
    onScheduleClick: (meeting?: Meeting) => void;
    onPersonalMeetingClick: () => void;
    onJoinWithLinkClick: () => void;
    onStartMeetingClick: () => void;
    onCreateRoomClick: () => void;
    meetings: Meeting[];
    isGuest: boolean;
    handleScheduleInCalendar: () => void;
    handleNewRoomClick: (room?: Meeting) => void;
    handleRotatePersonalMeeting?: () => void;
    loadingRotatePersonalMeeting?: boolean;
    meetingsListStatus: MeetingListStatus;
}

export const DashboardContainerBody = ({
    onScheduleClick,
    onJoinWithLinkClick,
    onStartMeetingClick,
    onCreateRoomClick,
    meetings,
    isGuest,
    handleScheduleInCalendar,
    handleNewRoomClick,
    handleRotatePersonalMeeting,
    loadingRotatePersonalMeeting,
    meetingsListStatus,
}: DashboardContainerBodyProps) => {
    const getHeadline = () => {
        // translator: this word is part of the full sentence "Your conversations matter" but we need to emphasize matter with a purple color
        const matterWord = (
            <span key="matter-word" className="meet-dashboard-headline-emphasized">
                {c('Info').t`matter`}
            </span>
        );
        // translator: full sentence is "Your conversations matter" where matter is emphasized with a purple color
        return c('Headline').jt`Your conversations ${matterWord}`;
    };

    return (
        <div className="overflow-y-auto h-full flex flex-column flex-nowrap">
            {!isGuest && <UpsellBannerWithUser />}
            <div className="flex-1 min-h-0 w-full meet-container-padding-x flex flex-column flex-nowrap meet-container relative">
                <PageHeader guestMode={isGuest} showAppSwitcher={!isElectronApp} />
                <div className="flex flex-column items-center flex-nowrap w-full shrink-0 meet-dashboard-header-wrapper">
                    <h1 className="meet-dashboard-headline text-center">{getHeadline()}</h1>
                    <span className="meet-dashboard-subtitle mt-5 mb-5 text-center text-wrap-balance">{c('Header')
                        .t`Speak freely again - every call is end-to-end encrypted`}</span>
                    <div className="flex justify-center meet-dashboard-cta-wrapper mt-5 mb-5 w-full">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <CreateMeetingDropdown
                                className="w-full"
                                onScheduleClick={onScheduleClick}
                                onStartMeetingClick={onStartMeetingClick}
                                onCreateRoomClick={onCreateRoomClick}
                            />
                            <Button
                                className="rounded-full border-none flex justify-center items-center tertiary text-rg py-4 px-6"
                                size="large"
                                onClick={onJoinWithLinkClick}
                            >
                                <span className="inline-flex items-center mr-2">
                                    <IcLink size={4} className="shrink-0 mr-2" />
                                    {c('Action').t`Join via link`}
                                </span>
                            </Button>
                        </div>
                    </div>
                </div>
                <DashboardMeetingListLoading
                    meetingsListStatus={meetingsListStatus}
                    meetings={meetings}
                    isGuest={isGuest}
                    handleScheduleInCalendar={handleScheduleInCalendar}
                    handleScheduleClick={onScheduleClick}
                    handleNewRoomClick={handleNewRoomClick}
                    handleRotatePersonalMeeting={handleRotatePersonalMeeting}
                    loadingRotatePersonalMeeting={loadingRotatePersonalMeeting}
                />
            </div>
        </div>
    );
};
