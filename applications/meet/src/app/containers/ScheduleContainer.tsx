import { Route, useRouteMatch } from 'react-router-dom';

import { CreateContainer } from './CreateContainer/CreateContainer';

export const ScheduleContainer = () => {
    const { path } = useRouteMatch();

    return (
        <div className="w-full h-full flex">
            <Route path={`${path}/create`} render={() => <CreateContainer />} />
        </div>
    );
};
