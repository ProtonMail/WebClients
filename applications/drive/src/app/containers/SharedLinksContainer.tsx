import { Route, Redirect, Switch, RouteComponentProps } from 'react-router-dom';

import DriveWindow from '../components/layout/DriveWindow';
import ShareFileSidebarButton from '../components/sections/SharedLinks/ShareFileSidebarButton';
import SharedLinksView from '../components/sections/SharedLinks/SharedLinksView';

const SharedLinksContainer = ({ match }: RouteComponentProps) => {
    return (
        <DriveWindow PrimaryButton={ShareFileSidebarButton}>
            <Switch>
                <Route path={match.url} exact component={SharedLinksView} />
                <Redirect to="/" />
            </Switch>
        </DriveWindow>
    );
};

export default SharedLinksContainer;
