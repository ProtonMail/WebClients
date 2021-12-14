import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { Route, Switch } from 'react-router-dom';

import createSecureSessionStorage from '@proton/shared/lib/authentication/createSecureSessionStorage';

import ViewMessage from '../components/message/ViewMessage';
import Reply from '../components/Reply';
import Unlock from '../components/Unlock';
import { init } from '../logic/eo/eoActions';

const PageContainer = () => {
    const { set, get } = createSecureSessionStorage();
    const dispatch = useDispatch();

    useEffect(() => {
        const initStore = async () => {
            await dispatch(init({ get }));
        };

        void initStore();
    }, []);

    return (
        <Switch>
            <Route path="/message/:id?">
                <ViewMessage />
            </Route>
            <Route path="/reply/:id?">
                <Reply />
            </Route>
            <Route path="/:id?">
                <Unlock setSessionStorage={set} />
            </Route>
        </Switch>
    );
};

export default PageContainer;
