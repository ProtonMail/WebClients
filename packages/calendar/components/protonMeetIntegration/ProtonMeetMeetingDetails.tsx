import type { EventModel } from '@proton/shared/lib/interfaces/calendar/Event';

import { VideoConferencingWidget } from '../videoConferencing/VideoConferencingWidget';
import { VIDEO_CONF_SERVICES } from '../videoConferencing/constants';
import { ProtonMeetRowContext } from './ProtonMeetRowContext';

interface ProtonMeetMeetingDetailsProps {
    passphrase: string;
    model: EventModel;
    savePassphrase: (passphrase: string) => Promise<void>;
    deleteMeeting: () => void;
}

export const ProtonMeetMeetingDetails = ({
    passphrase,
    model,
    savePassphrase,
    deleteMeeting,
}: ProtonMeetMeetingDetailsProps) => {
    return (
        <div className="flex flex-nowrap justify-space-between items-start">
            <ProtonMeetRowContext.Provider
                value={{
                    passphrase,
                    savePassphrase,
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
