import { useState } from 'react';
import { Route } from 'react-router-dom';

import type { MeetingDetails } from '../types';
import { CreateContainer } from './CreateContainer/CreateContainer';
import { DetailsContainer } from './DetailsContainer/DetailsContainer';

export const AdminContainer = () => {
    const [meetingDetails, setMeetingDetails] = useState<MeetingDetails | null>(null);

    return (
        <div className="w-full h-full flex items-center justify-center">
            <Route path="/admin/create" render={() => <CreateContainer onMeetingCreated={setMeetingDetails} />} />
            <Route
                path="/admin/details"
                render={() => (meetingDetails ? <DetailsContainer meetingDetails={meetingDetails} /> : null)}
            />
        </div>
    );
};
