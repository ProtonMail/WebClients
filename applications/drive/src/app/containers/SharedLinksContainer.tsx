import { useEffect } from 'react';
import { Redirect, Route, RouteComponentProps, Switch } from 'react-router-dom';

import SharedLinksView from '../components/sections/SharedLinks/SharedLinksView';
import useActiveShare from '../hooks/drive/useActiveShare';
import { useDriveEventManager } from '../store';
import { sendErrorReport } from '../utils/errorHandling';

const SharedLinksContainer = ({ match }: RouteComponentProps) => {
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
            <Route path={match.url} exact component={SharedLinksView} />
            <Redirect to="/" />
        </Switch>
    );
};

export default SharedLinksContainer;
