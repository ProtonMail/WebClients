import type { EventModel } from '@proton/shared/lib/interfaces/calendar/Event';

import { VideoConferencingWidget } from '../videoConferencing/VideoConferencingWidget';
import { VIDEO_CONF_SERVICES } from '../videoConferencing/constants';
import { ProtonMeetRowContext } from './ProtonMeetRowContext';

export interface ProtonMeetMeetingDetailsProps {
    passphrase: string;
    model: EventModel;
    savePassphrase: (passphrase: string) => Promise<void>;
    deleteMeeting: () => void;
    fetchingDetailsFailed: boolean;
    refetchMeeting: () => Promise<void>;
    hidePassphrase: boolean;
}

export const ProtonMeetMeetingDetails = ({
    passphrase,
    model,
    savePassphrase,
    deleteMeeting,
    fetchingDetailsFailed,
    refetchMeeting,
    hidePassphrase,
}: ProtonMeetMeetingDetailsProps) => {
    return (
        <div className="flex flex-nowrap justify-space-between items-start">
            <ProtonMeetRowContext.Provider
                value={{
                    passphrase,
                    savePassphrase,
                    fetchingDetailsFailed,
                    refetchMeeting,
                    hidePassphrase,
                }}
            >
                <VideoConferencingWidget
                    location="event-form"
                    handleDelete={deleteMeeting}
                    data={{
                        service: VIDEO_CONF_SERVICES.PROTON_MEET,
                        meetingId: model.conferenceId,
                        meetingUrl: model.conferenceUrl,
                        password: '',
                        meetingHost: model.conferenceHost,
                    }}
                />
            </ProtonMeetRowContext.Provider>
        </div>
    );
};
