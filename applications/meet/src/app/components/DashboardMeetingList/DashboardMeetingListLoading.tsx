import { c } from 'ttag';

import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';

import { MeetingListStatus } from '../../hooks/useMeetingList';
import { DashboardMeetingList, type DashboardMeetingListProps } from './DashboardMeetingList';

export const DashboardMeetingListLoading = ({
    meetingsListStatus,
    ...props
}: { meetingsListStatus: MeetingListStatus } & DashboardMeetingListProps) => {
    if (
        meetingsListStatus === MeetingListStatus.InitialLoading ||
        meetingsListStatus === MeetingListStatus.InitialDecrypting
    ) {
        const loadingText =
            meetingsListStatus === MeetingListStatus.InitialLoading
                ? c('Info').t`Loading meetings...`
                : c('Info').t`Decrypting meetings...`;

        return (
            <div className="flex flex-column flex-nowrap items-center justify-center gap-4 py-8">
                <CircleLoader size="large" className="color-primary" />
                <span className="text-rg color-weak">{loadingText}</span>
            </div>
        );
    }

    return <DashboardMeetingList {...props} />;
};
