import type { ReactNode } from 'react';
import { Switch } from 'react-router-dom';

import type { getMeetAppRoutes } from './routes';

const MeetSettingsRouter = ({
    redirect,
}: {
    meetAppRoutes: ReturnType<typeof getMeetAppRoutes>;
    redirect: ReactNode;
}) => {
    return <Switch>{redirect}</Switch>;
};

export default MeetSettingsRouter;
