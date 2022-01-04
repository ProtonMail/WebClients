import { Route, Switch } from 'react-router-dom';

import { LinkURLType } from '@proton/shared/lib/drive/constants';

import DriveView from '../components/sections/Drive/DriveView';
import PreviewContainer from './PreviewContainer';

const DriveContainer = () => {
    return (
        <>
            <Switch>
                <Route path="/:shareId?/:type?/:linkId?" component={DriveView} exact />
            </Switch>
            <Route path={`/:shareId?/${LinkURLType.FILE}/:linkId?`} component={PreviewContainer} exact />
        </>
    );
};

export default DriveContainer;
