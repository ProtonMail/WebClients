import type { EventModel } from '@proton/shared/lib/interfaces/calendar/Event';

import { VideoConferencingWidget } from '../videoConferencing/VideoConferencingWidget';
import { VIDEO_CONF_SERVICES } from '../videoConferencing/constants';

export interface ProtonMeetMeetingDetailsProps {
    model: EventModel;
    deleteMeeting: () => void;
}

export const ProtonMeetMeetingDetails = ({ model, deleteMeeting }: ProtonMeetMeetingDetailsProps) => {
    return (
        <div className="flex flex-nowrap justify-space-between items-start">
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
        </div>
    );
};
