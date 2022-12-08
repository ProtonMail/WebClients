import { useEffect } from 'react';
import { Redirect, Route, RouteComponentProps, Switch } from 'react-router-dom';

import TrashView from '../components/sections/Trash/TrashView';
import useActiveShare from '../hooks/drive/useActiveShare';
import { useDriveEventManager } from '../store';
import { sendErrorReport } from '../utils/errorHandling';

const TrashContainer = ({ match }: RouteComponentProps) => {
    const events = useDriveEventManager();
    const { activeFolder } = useActiveShare();

    useEffect(() => {
        events.shares.startSubscription(activeFolder.shareId).catch(sendErrorReport);
        return () => {
            events.shares.pauseSubscription(activeFolder.shareId);
        };
    }, [activeFolder.shareId]);

    return (
        <Switch>
            <Route path={match.url} exact component={TrashView} />
            <Redirect to="/trash" />
        </Switch>
    );
};

export default TrashContainer;
