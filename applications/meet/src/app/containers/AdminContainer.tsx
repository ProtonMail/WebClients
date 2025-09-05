import { Route, useRouteMatch } from 'react-router-dom';

import { CreateContainer } from './CreateContainer/CreateContainer';

export const AdminContainer = () => {
    const { path } = useRouteMatch();

    return (
        <div className="w-full h-full flex items-center justify-center">
            <Route path={`${path}/create`} render={() => <CreateContainer />} />
        </div>
    );
};
