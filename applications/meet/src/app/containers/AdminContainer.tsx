import { useState } from 'react';
import { Route, useRouteMatch } from 'react-router-dom';

import type { MeetingDetails } from '../types';
import { CreateContainer } from './CreateContainer/CreateContainer';
import { DetailsContainer } from './DetailsContainer/DetailsContainer';

export const AdminContainer = () => {
    const { path } = useRouteMatch();

    const [meetingDetails, setMeetingDetails] = useState<MeetingDetails | null>(null);

    return (
        <div className="w-full h-full flex items-center justify-center">
            {/* @ts-expect-error */}
            <Route path={`${path}/create`} render={() => <CreateContainer onMeetingCreated={setMeetingDetails} />} />
            <Route
                path={`${path}/details`}
                render={() => (meetingDetails ? <DetailsContainer meetingDetails={meetingDetails} /> : null)}
            />
        </div>
    );
};
